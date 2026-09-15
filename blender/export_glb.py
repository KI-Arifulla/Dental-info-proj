"""Export one GLB per treatment into public/models. Objects are temporarily parented under a x100 root
so 1 mm = 0.1 scene units in three.js; heavy meshes are decimated to a face budget first.

After exporting, compress for the web (drei's useGLTF decodes meshopt locally, no CDN):
    for f in implants rootcanal ortho; do
      npx @gltf-transform/cli@4 meshopt public/models/$f.glb public/models/$f.glb --level medium
    done
"""
import os

import bpy

O = bpy.data.objects
OUT = "/Users/arif/dental-info-proj/public/models"
FACE_BUDGET = 16000
# Boolean-cut section pieces crack along their cap edges when decimated hard.
SECTION_FACE_BUDGET = 30000

TEETH = ["SEC_ADJ_Left", "SEC_ADJ_Right", "SEC_ADJ_Left_Front", "SEC_ADJ_Right_Front"]


def jaw(variant):
    """Sectioned jaw from build_section.py: static back half plus the *_Front pieces the viewer peels away."""
    return TEETH + [f"SEC_{part}_{variant}" for part in ("Gum", "Cortical", "Cancellous", "PDL_Left", "PDL_Right")] + [
        f"SEC_Gum_{variant}_Front", f"SEC_Bone_{variant}_Front"]


SCENES = {
    "implants": jaw("Ridge") + [o.name for o in bpy.data.collections["V2_Implants"].objects],
    "rootcanal": jaw("Standard") + [o.name for o in bpy.data.collections["V2_RootCanal"].objects],
    "ortho": jaw("Standard") + [o.name for o in bpy.data.collections["V2_Ortho"].objects],
}


def enforce_budget(obj):
    faces = len(obj.data.polygons)
    budget = SECTION_FACE_BUDGET if obj.name.startswith("SEC_") else FACE_BUDGET
    if faces <= budget:
        return
    d = obj.modifiers.new("Budget", "DECIMATE")
    d.ratio = FACE_BUDGET / faces
    with bpy.context.temp_override(object=obj, active_object=obj):
        bpy.ops.object.modifier_apply(modifier="Budget")


os.makedirs(OUT, exist_ok=True)
for file_name, names in SCENES.items():
    root = O.get("SCENE_ROOT") or bpy.data.objects.new("SCENE_ROOT", None)
    if root.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(root)
    root.scale = (100, 100, 100)
    bpy.ops.object.select_all(action="DESELECT")
    objs = [O[n] for n in names]
    for o in objs:
        enforce_budget(o)
        o.hide_set(False)
        o.parent = root
        o.matrix_parent_inverse.identity()
        o.select_set(True)
    root.select_set(True)
    bpy.context.view_layer.objects.active = root
    path = f"{OUT}/{file_name}.glb"
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_texcoords=False,
                              export_normals=True, export_extras=False, export_animations=False)
    for o in objs:
        o.parent = None
        o.hide_set(True)
        o.select_set(False)
    print(file_name, len(objs), "objects", round(os.path.getsize(path) / 1e6, 2), "MB",
          sum(len(o.data.polygons) for o in objs), "faces")
