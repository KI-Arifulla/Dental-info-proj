"""Shared helpers for building the dental GLB scenes in Blender.

All authoring helpers take millimetres; the Blender scene stores metres (1 mm = 0.001).
Run the build_*.py scripts through the Blender MCP bridge, e.g.
    exec(open('/Users/arif/dental-info-proj/blender/build_jaw.py').read())
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector, noise

MM = 0.001
# Long axis of the treated (centre) tooth, measured from its crown cross-sections.
TOOTH_AXIS_XY = (2.15, -0.4)


# ---------------------------------------------------------------- scene plumbing
def collection(name, parent="Collection"):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        bpy.data.collections[parent].children.link(c)
    return c


def material(name, rgba, metal=0.0, rough=0.5, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 1.0:
        try:
            m.surface_render_method = "BLENDED"
        except AttributeError:
            m.blend_method = "BLEND"
    return m


def remove_object(name):
    o = bpy.data.objects.get(name)
    if o is not None:
        me = o.data if o.type == "MESH" else None
        bpy.data.objects.remove(o)
        if me is not None and me.users == 0:
            bpy.data.meshes.remove(me)


def object_from_bm(name, bm, mat, coll, smooth=True):
    remove_object(name)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if mat is not None:
        me.materials.append(mat)
    if smooth:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    return o


def world_bm(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    return bm


def copy_object(src_name, name, mat, coll):
    return object_from_bm(name, world_bm(bpy.data.objects[src_name]), mat, coll)


def apply_modifiers(obj):
    for m in list(obj.modifiers):
        with bpy.context.temp_override(object=obj, active_object=obj):
            bpy.ops.object.modifier_apply(modifier=m.name)


def remesh(obj, voxel_mm, smooth=0, ratio=1.0):
    r = obj.modifiers.new("Remesh", "REMESH")
    r.mode = "VOXEL"
    r.voxel_size = voxel_mm * MM
    if smooth:
        s = obj.modifiers.new("Smooth", "CORRECTIVE_SMOOTH")
        s.iterations = smooth
        s.use_only_smooth = True
    apply_modifiers(obj)
    if ratio < 1.0:
        d = obj.modifiers.new("Decimate", "DECIMATE")
        d.ratio = ratio
        apply_modifiers(obj)
    obj.data.polygons.foreach_set("use_smooth", [True] * len(obj.data.polygons))


def boolean(target, cutter, op="DIFFERENCE", hole_tolerant=True):
    b = target.modifiers.new("Bool", "BOOLEAN")
    b.operation = op
    b.solver = "EXACT"
    b.object = cutter
    b.use_hole_tolerant = hole_tolerant
    b.material_mode = "TRANSFER"
    apply_modifiers(target)


def filled_copy(src_name, name, coll):
    """Watertight world-space copy (holes capped) for use as a boolean operand."""
    bm = world_bm(bpy.data.objects[src_name])
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = object_from_bm(name, bm, None, coll)
    o.hide_render = True
    return o


def transform_object(obj, matrix):
    obj.data.transform(matrix)
    obj.data.update()


def rotation_about(point_mm, axis, angle_deg):
    p = Vector(point_mm) * MM
    return Matrix.Translation(p) @ Matrix.Rotation(math.radians(angle_deg), 4, axis) @ Matrix.Translation(-p)


# ---------------------------------------------------------------- primitives (mm)
def heightfield_solid(fn, x0, x1, y0, y1, zb, step=0.25):
    """Closed block whose top follows z = fn(x, y); bottom is zb, a constant or a zb(x, y) function (all mm)."""
    bottom = zb if callable(zb) else (lambda x, y: zb)
    nx = int(round((x1 - x0) / step)) + 1
    ny = int(round((y1 - y0) / step)) + 1
    bm = bmesh.new()
    top = [[bm.verts.new(((x0 + i * step) * MM, (y0 + j * step) * MM, fn(x0 + i * step, y0 + j * step) * MM))
            for j in range(ny)] for i in range(nx)]
    bot = [[bm.verts.new(((x0 + i * step) * MM, (y0 + j * step) * MM, bottom(x0 + i * step, y0 + j * step) * MM))
            for j in range(ny)] for i in range(nx)]
    for i in range(nx - 1):
        for j in range(ny - 1):
            bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]))
            bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]))
    ring = ([(i, 0) for i in range(nx)] + [(nx - 1, j) for j in range(1, ny)]
            + [(i, ny - 1) for i in range(nx - 2, -1, -1)] + [(0, j) for j in range(ny - 2, 0, -1)])
    for k, a in enumerate(ring):
        b = ring[(k + 1) % len(ring)]
        bm.faces.new((top[b[0]][b[1]], top[a[0]][a[1]], bot[a[0]][a[1]], bot[b[0]][b[1]]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def lathe(profile, seg=48, thread=None):
    """Revolve [(depth_mm, radius_mm)] around the local -Z axis. thread(t, theta) -> radius offset."""
    bm = bmesh.new()
    rings = []
    for t, rad in profile:
        ring = []
        for k in range(seg):
            th = 2 * math.pi * k / seg
            rr = rad + (thread(t, th) if thread else 0.0)
            ring.append(bm.verts.new((rr * math.cos(th), rr * math.sin(th), -t)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(seg):
            bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def place(bm, base_mm, axis=(0, 0, -1)):
    """Move a lathe built in mm (pointing down local -Z) to base_mm, pointing along axis."""
    rot = Vector((0, 0, -1)).rotation_difference(Vector(axis).normalized()).to_matrix().to_4x4()
    bm.transform(Matrix.Translation(Vector(base_mm) * MM) @ rot @ Matrix.Scale(MM, 4))
    return bm


def tube(points_mm, radii_mm, seg=16, cap=True):
    """Swept circular tube through points (mm) with per-point radius (mm)."""
    pts = [Vector(p) for p in points_mm]
    bm = bmesh.new()
    rings = []
    normal = None
    for i, p in enumerate(pts):
        tangent = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        if normal is None:
            helper = Vector((0, 0, 1)) if abs(tangent.z) < 0.9 else Vector((1, 0, 0))
            normal = tangent.cross(helper).normalized()
        else:  # parallel transport keeps the rings from twisting
            normal = (normal - tangent * normal.dot(tangent)).normalized()
        binormal = tangent.cross(normal)
        r = radii_mm[i]
        rings.append([bm.verts.new((p + (normal * math.cos(a) + binormal * math.sin(a)) * r) * MM)
                      for a in (2 * math.pi * k / seg for k in range(seg))])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg):
            bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    if cap:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def blob(center_mm, radius_mm, lumpiness=0.0, seed=0.0, scale=(1, 1, 1), subdiv=4):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    c = Vector(center_mm)
    for v in bm.verts:
        d = v.co.normalized()
        r = radius_mm * (1.0 + lumpiness * noise.noise(d * 1.8 + Vector((seed, seed, seed))))
        v.co = (c + Vector((d.x * scale[0], d.y * scale[1], d.z * scale[2])) * r) * MM
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def box(center_mm, size_mm):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.transform(Matrix.Translation(Vector(center_mm) * MM) @ Matrix.Diagonal((*[s * MM for s in size_mm], 1)))
    return bm


def bbox_mm(obj):
    ws = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    return ([round(min(v[i] for v in ws) / MM, 2) for i in range(3)],
            [round(max(v[i] for v in ws) / MM, 2) for i in range(3)])
