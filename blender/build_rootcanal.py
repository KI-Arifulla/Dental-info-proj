"""Root canal conditions and treatment parts for the centre tooth.

Conditions: decay cavity, infected pulp, periapical abscess, fractured cusp with crack.
Treatment:  access cavity, medicated canals, gutta-percha filled canals, temporary / composite
            fillings, fibre post, prepared stump and full crown.
"""
import importlib
import sys

import bmesh
import bpy
from mathutils import Matrix

sys.path.insert(0, "/Users/arif/dental-info-proj/blender")
import dental_lib as L

importlib.reload(L)
O = bpy.data.objects
coll = L.collection("V2_RootCanal")
tmp = L.collection("V2_Cutters")

enamel = L.material("V2_Enamel", (0.7, 0.64, 0.53, 1), rough=0.35)
decay = L.material("V2_Decay", (0.08, 0.04, 0.02, 1), rough=0.85)
cavity_wall = L.material("V2_CavityWall", (0.8, 0.68, 0.5, 1), rough=0.6)
temp_fill = L.material("V2_TempFilling", (0.78, 0.78, 0.74, 1), rough=0.7)
composite = L.material("V2_Composite", (0.74, 0.68, 0.56, 1), rough=0.3)
pulp_ok = L.material("V2_PulpHealthy", (0.75, 0.28, 0.32, 1), rough=0.5)
pulp_bad = L.material("V2_PulpInfected", (0.16, 0.005, 0.015, 1), rough=0.6)
medicated = L.material("V2_CanalMedicated", (0.95, 0.95, 0.9, 1), rough=0.8)
gutta = L.material("V2_GuttaPercha", (0.86, 0.42, 0.26, 1), rough=0.45)
abscess = L.material("V2_Abscess", (0.55, 0.18, 0.1, 1), rough=0.6, alpha=0.85)
post_mat = L.material("V2_FiberPost", (0.96, 0.96, 0.94, 1), rough=0.4)
dentin = L.material("V2_Dentin", (0.62, 0.48, 0.3, 1), rough=0.55)
zirconia = L.material("V2_Zirconia", (0.8, 0.77, 0.7, 1), rough=0.3)


def solid(name, bm, mat=None, voxel=None):
    o = L.object_from_bm(name, bm, mat, tmp)
    if voxel:
        L.remesh(o, voxel)
    o.hide_set(True)
    o.hide_render = True
    return o


def tooth_result(name, base_src, cutters, op="DIFFERENCE", mat=enamel, ratio=0.3):
    o = L.copy_object(base_src, name, mat, coll)
    for c in cutters:
        L.boolean(o, c, op)
    d = o.modifiers.new("Decimate", "DECIMATE")
    d.ratio = ratio
    L.apply_modifiers(o)
    return o


filled = L.filled_copy("Object_2", "CUT_Tooth_Filled", tmp)
filled.hide_set(True)

# ---- cutters (materials transfer onto the new cavity walls)
# Large mesio-occlusal cavity, pushed toward the cheek side so it reads from the default camera.
decay_cut = solid("CUT_Decay", L.blob((0.9, -1.2, 8.9), 3.0, lumpiness=0.45, seed=3.1), decay, voxel=0.08)
access_cut = solid("CUT_Access", L.blob((0.9, -1.2, 8.9), 3.1, lumpiness=0.2, seed=3.1), cavity_wall)
shaft = solid("CUT_AccessShaft", L.place(L.lathe([(0.0, 1.9), (6.5, 1.5)], 32), (2.15, -0.3, 11.0)), cavity_wall)
L.boolean(access_cut, shaft, "UNION")
L.remesh(access_cut, 0.08)
crack_cut = solid("CUT_Crack", L.box((3.0, -0.4, 9.5), (9.0, 0.12, 5.0)), decay)
cusp_cut = solid("CUT_Cusp", L.box((6.6, -4.6, 10.6), (5.0, 4.4, 5.0)), cavity_wall)
cusp_cut.data.transform(L.rotation_about((6.6, -4.6, 10.6), "X", -25))

# ---- tooth states
tooth_result("RCT_Tooth_Decayed", "CUT_Tooth_Filled", [decay_cut])
tooth_result("RCT_Tooth_Accessed", "CUT_Tooth_Filled", [access_cut])
tooth_result("RCT_Tooth_Fractured", "CUT_Tooth_Filled", [decay_cut, cusp_cut, crack_cut])
tooth_result("RCT_Fill_Temp", "CUT_Tooth_Filled", [access_cut], op="INTERSECT", mat=temp_fill, ratio=0.5)
tooth_result("RCT_Fill_Composite", "CUT_Tooth_Filled", [access_cut], op="INTERSECT", mat=composite, ratio=0.5)
for o in (O["RCT_Fill_Temp"], O["RCT_Fill_Composite"]):  # intersect keeps cutter material; force the filling one
    o.data.materials.clear()
    o.data.materials.append(temp_fill if o.name.endswith("Temp") else composite)
    o.data.polygons.foreach_set("material_index", [0] * len(o.data.polygons))

# ---- pulp and canals (centrelines follow the measured root cross-sections)
chamber = L.blob((2.15, -0.3, 4.6), 1.5, scale=(1.25, 0.95, 0.75))
canal_a = L.tube([(2.2, -0.4, 4.2), (2.5, -0.9, -1.5), (2.3, -1.6, -4.2), (2.1, -2.0, -5.0), (2.09, -2.72, -6.0),
                  (2.07, -3.0, -6.6)], [0.6, 0.42, 0.3, 0.24, 0.17, 0.1], seg=12)
canal_b = L.tube([(2.4, -0.4, 4.2), (2.9, -1.0, -1.5), (3.9, -1.8, -4.2), (4.8, -2.64, -5.0), (4.65, -3.37, -6.0),
                  (4.6, -3.5, -6.6)], [0.6, 0.42, 0.3, 0.24, 0.17, 0.1], seg=12)
pulp_bm = bmesh.new()
for part in (chamber, canal_a, canal_b):
    me = bpy.data.meshes.new("tmp")
    part.to_mesh(me)
    part.free()
    pulp_bm.from_mesh(me)
    bpy.data.meshes.remove(me)
pulp = L.object_from_bm("RCT_Pulp_Healthy", pulp_bm, pulp_ok, coll)
L.remesh(pulp, 0.06, smooth=4, ratio=0.4)
for name, mat in (("RCT_Pulp_Infected", pulp_bad), ("RCT_Canal_Medicated", medicated)):
    L.copy_object("RCT_Pulp_Healthy", name, mat, coll)
# Gutta-percha fills the canals only; the chamber is sealed by the core / filling.
bm = L.world_bm(pulp)
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 3.2 * L.MM),
                       plane_no=(0, 0, 1), clear_outer=True)
bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
L.object_from_bm("RCT_Canal_Filled", bm, gutta, coll)

L.object_from_bm("RCT_Abscess_Large", L.blob((3.3, -3.2, -7.5), 1.6, lumpiness=0.3, seed=7.0), abscess, coll)
L.object_from_bm("RCT_Abscess_Small", L.blob((3.3, -3.2, -7.2), 0.8, lumpiness=0.3, seed=7.0), abscess, coll)
L.object_from_bm("RCT_Post", L.place(L.lathe([(0.0, 0.8), (1.0, 0.75), (6.0, 0.45), (6.2, 0.3)], 24),
                                     (2.3, -0.45, 3.8), (0.05, -0.08, -1)), post_mat, coll)

# ---- crown option: prepared stump + zirconia crown
for name, src, mat in (("RCT_Tooth_Prepared", "Prepared_Tooth_Mesh", dentin), ("RCT_Crown", "Crown_Mesh", zirconia)):
    o = L.copy_object(src, name, mat, coll)
    d = o.modifiers.new("Decimate", "DECIMATE")
    d.ratio = 0.3
    L.apply_modifiers(o)

for o in coll.objects:
    print(o.name, len(o.data.polygons), L.bbox_mm(o))
