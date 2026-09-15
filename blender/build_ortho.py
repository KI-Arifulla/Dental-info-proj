"""Orthodontic scenes: crowded (rotated + displaced) centre tooth, aligned tooth, brackets, wires,
ligature ties and a clear aligner tray. Ceramic and metal braces share geometry, differ in materials."""
import importlib
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, "/Users/arif/dental-info-proj/blender")
import dental_lib as L

importlib.reload(L)
O = bpy.data.objects
AX, AY = L.TOOTH_AXIS_XY
coll = L.collection("V2_Ortho")
tmp = L.collection("V2_Cutters")

enamel = L.material("V2_Enamel", (0.7, 0.64, 0.53, 1), rough=0.35)
steel = L.material("V2_BracketSteel", (0.72, 0.73, 0.75, 1), metal=1.0, rough=0.15)
ceramic = L.material("V2_BracketCeramic", (0.74, 0.7, 0.64, 1), rough=0.2, alpha=0.9)
wire_steel = L.material("V2_WireSteel", (0.75, 0.76, 0.78, 1), metal=1.0, rough=0.12)
wire_white = L.material("V2_WireCoated", (0.92, 0.91, 0.88, 1), rough=0.3)
tie_blue = L.material("V2_TieBlue", (0.1, 0.35, 0.85, 1), rough=0.4)
tie_clear = L.material("V2_TieClear", (0.85, 0.85, 0.82, 1), rough=0.3, alpha=0.7)
tray = L.material("V2_AlignerTray", (0.55, 0.75, 0.92, 1), rough=0.08, alpha=0.55)

CROOKED = (L.rotation_about((AX, AY, 0), "Z", 30) @ L.rotation_about((AX, AY, -3), "X", 7)
           @ Matrix.Translation((0, 1.2 * L.MM, 0.6 * L.MM)))


def decimated_copy(src, name, mat, matrix=None, collection=coll, ratio=0.3):
    o = L.copy_object(src, name, mat, collection)
    if matrix is not None:
        L.transform_object(o, matrix)
    if ratio < 1:
        d = o.modifiers.new("Decimate", "DECIMATE")
        d.ratio = ratio
        L.apply_modifiers(o)
    return o


decimated_copy("Object_2", "ORT_Tooth_Crooked", enamel, CROOKED)
decimated_copy("Object_2", "ORT_Tooth_Aligned", enamel)

TEETH_X = {"left": -8.5, "centre": AX, "right": 10.7}
BRACKET_Z = 6.0


def buccal_frame(obj, x):
    me = obj.data
    tree = BVHTree.FromPolygons([obj.matrix_world @ v.co for v in me.vertices], [p.vertices[:] for p in me.polygons])
    hit, normal, _, _ = tree.ray_cast(Vector((x * L.MM, -20 * L.MM, BRACKET_Z * L.MM)), Vector((0, 1, 0)))
    n = normal.normalized()
    if n.y > 0:
        n = -n
    t = Vector((0, 0, 1)).cross(n).normalized()
    up = n.cross(t).normalized()
    return hit, Matrix((t, up, n)).transposed().to_4x4()


def bracket_parts(frame_loc, frame_rot):
    """Pad + body + 4 tie wings in bracket space (x along arch, y up, z out of tooth), in mm."""
    bm = bmesh.new()
    for c, s in (((0, 0, 0.2), (3.2, 3.0, 0.4)), ((0, 0, 0.75), (2.4, 1.2, 0.9)),
                 ((-0.85, 0.95, 0.9), (0.7, 0.7, 1.2)), ((0.85, 0.95, 0.9), (0.7, 0.7, 1.2)),
                 ((-0.85, -0.95, 0.9), (0.7, 0.7, 1.2)), ((0.85, -0.95, 0.9), (0.7, 0.7, 1.2))):
        part = L.box(c, s)
        me = bpy.data.meshes.new("tmp")
        part.to_mesh(me)
        part.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    bm.transform(Matrix.Translation(frame_loc) @ frame_rot)
    return bm


def bracket_set(centre_tooth, suffix):
    slots = []
    brackets = bmesh.new()
    ties = bmesh.new()
    for key, src in (("left", "Object_2.002"), ("centre", centre_tooth), ("right", "Object_2.003")):
        loc, rot = buccal_frame(O[src], TEETH_X[key])
        part = bracket_parts(loc, rot)
        me = bpy.data.meshes.new("tmp")
        part.to_mesh(me)
        part.free()
        brackets.from_mesh(me)
        bpy.data.meshes.remove(me)
        slot = loc + (rot @ Vector((0, 0, 1.0 * L.MM)).to_4d()).to_3d()
        slots.append(slot / L.MM)
        ring = [(rot @ Vector((1.25 * math.cos(a), 1.25 * math.sin(a), 0.95)).to_4d()).to_3d() * L.MM + loc
                for a in (2 * math.pi * k / 24 for k in range(25))]
        tie = L.tube([p / L.MM for p in ring], [0.2] * 25, seg=8, cap=False)
        me = bpy.data.meshes.new("tmp")
        tie.to_mesh(me)
        tie.free()
        ties.from_mesh(me)
        bpy.data.meshes.remove(me)
    # wire: extend beyond the outer brackets and smooth with one Chaikin pass
    left, mid, right = slots
    pts = [left + (left - mid).normalized() * 5.0, left, mid, right, right + (right - mid).normalized() * 3.5]
    for _ in range(3):
        smooth = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            smooth += [a * 0.75 + b * 0.25, a * 0.25 + b * 0.75]
        smooth.append(pts[-1])
        pts = smooth
    wire_bm = L.tube(pts, [0.22] * len(pts), seg=10)
    for material_name, bracket_mat, wire_mat, tie_mat in (("Metal", steel, wire_steel, tie_blue),
                                                          ("Ceramic", ceramic, wire_white, tie_clear)):
        b = brackets.copy()
        L.object_from_bm(f"ORT_Brackets_{material_name}_{suffix}", b, bracket_mat, coll, smooth=False)
        L.object_from_bm(f"ORT_Wire_{material_name}_{suffix}", wire_bm.copy(), wire_mat, coll)
        L.object_from_bm(f"ORT_Ties_{material_name}_{suffix}", ties.copy(), tie_mat, coll)
    brackets.free()
    ties.free()
    wire_bm.free()


bracket_set("ORT_Tooth_Crooked", "Crooked")
bracket_set("ORT_Tooth_Aligned", "Aligned")

# Clear aligner tray over the crowded arch: voxel shell of the crowns, pushed outward, trimmed at the gum line.
shell = bmesh.new()
for src, matrix in (("CUT_Object_2.002", None), ("CUT_Object_2", CROOKED), ("CUT_Object_2.003", None)):
    part = L.world_bm(O[src])
    if matrix is not None:
        part.transform(matrix)
    me = bpy.data.meshes.new("tmp")
    part.to_mesh(me)
    part.free()
    shell.from_mesh(me)
    bpy.data.meshes.remove(me)
tray_obj = L.object_from_bm("ORT_Aligner_Tray", shell, tray, coll)
L.remesh(tray_obj, 0.1, smooth=4)
disp = tray_obj.modifiers.new("Offset", "DISPLACE")
disp.strength = 0.5 * L.MM
disp.mid_level = 0.0
L.apply_modifiers(tray_obj)
bm = L.world_bm(tray_obj)
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 2.3 * L.MM),
                       plane_no=(0, 0, 1), clear_inner=True)
tray_obj = L.object_from_bm("ORT_Aligner_Tray", bm, tray, coll)
# No second voxel remesh: the trimmed shell is open, and voxel-remeshing an open surface keeps only
# enclosed pockets (fissures, contacts), which left the tray as thin lines. Smooth in place instead;
# the export face budget handles density.
smooth = tray_obj.modifiers.new("Smooth", "CORRECTIVE_SMOOTH")
smooth.iterations = 6
smooth.use_only_smooth = True
L.apply_modifiers(tray_obj)
tray_obj.data.polygons.foreach_set("use_smooth", [True] * len(tray_obj.data.polygons))

for o in coll.objects:
    print(o.name, len(o.data.polygons), L.bbox_mm(o))
