"""Cross-section jaw. Every jaw layer is split at the tooth-centre plane (y = CUT_Y):

  back half  (static) - capped cut faces with their own "*_Cut" materials, sockets and root outlines
  front half (peel)   - slides toward the camera in the viewer, revealing the section behind it

Neighbouring teeth are sectioned only below CROWN_KEEP_Z so their crowns stay whole. The treated tooth /
implant objects are left whole and simply sit on the section face. Needs build_jaw.py and build_implants.py
objects (JAW_*, ADJ_*) to exist. Cutter helpers live in the V3_Cutters collection (hidden)."""
import importlib
import sys

import bpy

sys.path.insert(0, "/Users/arif/dental-info-proj/blender")
import dental_lib as L

importlib.reload(L)
exec(open("/Users/arif/dental-info-proj/blender/build_jaw.py").read().split("jaw = L.collection")[0])  # height fns

O = bpy.data.objects
CUT_Y = -0.4  # tooth centre; matches TOOTH_CENTRE_Y in src/three/DentalSceneModel.tsx
CROWN_KEEP_Z = 1.0
PDL_MM = 0.18
CORTICAL_MM = 1.0

coll = L.collection("V3_Section")
cutters = L.collection("V3_Cutters")

enamel = bpy.data.materials["V2_Enamel"]
gum_cut = L.material("V3_Gum_Cut", (0.62, 0.27, 0.29, 1), rough=0.7)
cortical_cut = L.material("V3_Cortical_Cut", (0.9, 0.86, 0.76, 1), rough=0.8)
cancellous_cut = L.material("V3_Cancellous_Cut", (0.84, 0.77, 0.62, 1), rough=0.95)
dentin_cut = L.material("V3_Dentin_Cut", (0.88, 0.82, 0.7, 1), rough=0.6)
pdl = L.material("V3_PDL", (0.42, 0.18, 0.18, 1), rough=0.8)


def front_cutter(name, mat, z_top=40.0):
    """Box covering everything in front of the cut plane (cheek side, -Y) and below z_top."""
    o = L.object_from_bm(name, L.box((0, (-40 + CUT_Y) / 2, (z_top - 40) / 2), (80, 40 + CUT_Y, z_top + 40)),
                         mat, cutters)
    o.hide_render = True
    return o


def dup(src, name, mat=None):
    o = L.copy_object(src.name, name, mat if mat is not None else src.data.materials[0], coll)
    return o


def cut(target, *operands, op="DIFFERENCE"):
    for operand in operands:
        L.boolean(target, operand, op)
    return target


def watertight_tooth(src_name, name):
    o = L.filled_copy(src_name, name, cutters)
    L.remesh(o, 0.08, ratio=0.3)
    o.data.materials.append(enamel)
    return o


def inflated(src, name, mm):
    o = L.object_from_bm(name, L.world_bm(src), None, cutters)
    d = o.modifiers.new("Inflate", "DISPLACE")
    d.direction = "NORMAL"
    d.mid_level = 0.0
    d.strength = mm * L.MM
    L.apply_modifiers(o)
    # Displacing along normals folds concave areas into self-intersections, which empty EXACT booleans.
    L.remesh(o, 0.08, ratio=0.3)
    o.hide_render = True
    return o


def cancellous_core(variant, ridge):
    o = L.object_from_bm(
        f"CUT_Core_{variant}",
        L.heightfield_solid(lambda x, y: bone_height(x, y, ridge) - CORTICAL_MM, -14.4 + CORTICAL_MM,
                            14.4 - CORTICAL_MM, -6.7 + CORTICAL_MM, 6.5 - CORTICAL_MM, -9.8 + CORTICAL_MM),
        cancellous_cut, cutters)
    L.remesh(o, 0.22, smooth=8, ratio=0.3)
    o.hide_render = True
    return o


# ---- shared: watertight neighbours, their sockets, sectioned tooth halves
cut_gum = front_cutter("CUT_Front_Gum", gum_cut)
cut_cortical = front_cutter("CUT_Front_Cortical", cortical_cut)
cut_cancellous = front_cutter("CUT_Front_Cancellous", cancellous_cut)
cut_pdl = front_cutter("CUT_Front_PDL", pdl)
cut_tooth = front_cutter("CUT_Front_Tooth", dentin_cut, z_top=CROWN_KEEP_Z)

teeth, sockets = [], []
for side in ("Left", "Right"):
    solid = watertight_tooth(f"ADJ_{side}", f"CUT_Tooth_{side}")
    teeth.append(solid)
    sockets.append(inflated(solid, f"CUT_Socket_{side}", PDL_MM))
    cut(dup(solid, f"SEC_ADJ_{side}"), cut_tooth)
    cut(dup(solid, f"SEC_ADJ_{side}_Front"), cut_tooth, op="INTERSECT")

# ---- per jaw variant
for variant, ridge in (("Standard", False), ("Ridge", True)):
    gum, bone = O[f"JAW_Gum_{variant}"], O[f"JAW_Bone_{variant}"]
    core = cancellous_core(variant, ridge)
    bone_solid = L.filled_copy(bone.name, f"CUT_BoneSolid_{variant}", cutters)

    cut(dup(core, f"SEC_Cancellous_{variant}", cancellous_cut), cut_cancellous, *sockets)
    cut(dup(bone, f"SEC_Cortical_{variant}"), core, cut_cortical, *sockets)
    cut(dup(gum, f"SEC_Gum_{variant}"), bone_solid, cut_gum, *teeth)
    for side, tooth, socket in zip(("Left", "Right"), teeth, sockets):
        ligament = dup(socket, f"SEC_PDL_{side}_{variant}", pdl)
        cut(ligament, bone_solid, op="INTERSECT")
        cut(ligament, tooth, cut_pdl)

    cut(cut(dup(gum, f"SEC_Gum_{variant}_Front"), bone_solid), cut_gum, op="INTERSECT")
    cut(dup(bone, f"SEC_Bone_{variant}_Front"), cut_cortical, op="INTERSECT")

for c in cutters.objects:
    c.hide_set(True)
for o in sorted(coll.objects, key=lambda o: o.name):
    print(o.name, len(o.data.polygons), L.bbox_mm(o), [m.name for m in o.data.materials])
