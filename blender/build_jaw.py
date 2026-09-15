"""Gum + bone layers. Solid gum wraps a smaller bone block, so fading or cutting the gum reveals bone,
and fading bone reveals roots / implants. Teeth are not boolean-cut: they pass through the solids,
which renders as a seamless gum line for any tooth shape (natural, rotated, crowned, implant)."""
import importlib
import math
import sys

sys.path.insert(0, "/Users/arif/dental-info-proj/blender")
import dental_lib as L

importlib.reload(L)

AX, AY = L.TOOTH_AXIS_XY
PAPILLAE = (-3.05, 7.58)


def gum_height(x, y, ridge=False):
    z = 1.6
    for xp in PAPILLAE:
        bump = 1.1 * math.exp(-((x - xp) / 1.1) ** 2) * math.exp(-((y + 0.3) / 3.2) ** 2)
        z += bump * (0.35 if ridge else 1.0)
    if ridge:  # healed extraction site: flattened, slightly concave crest
        z -= 0.9 * math.exp(-((x - AX) / 3.4) ** 2) * math.exp(-((y - AY) / 4.5) ** 2)
    dy = max(0.0, abs(y + 0.3) - 5.3)
    dx = max(0.0, abs(x) - 13.8)
    return max(z - 0.7 * dy * dy - 0.7 * dx * dx, -7.0)


def bone_height(x, y, ridge=False):
    # Alveolar crest sits ~2 mm below the gum margin and follows a softer scallop.
    return gum_height(x, y, ridge) - 2.1


jaw = L.collection("V2_Jaw")
gum_mat = L.material("V2_Gum", (0.46, 0.15, 0.2, 1), rough=0.6)
bone_mat = L.material("V2_Bone", (0.66, 0.56, 0.4, 1), rough=0.85)

for variant, ridge in (("Standard", False), ("Ridge", True)):
    g = L.object_from_bm(f"JAW_Gum_{variant}",
                         L.heightfield_solid(lambda x, y: gum_height(x, y, ridge), -15.6, 15.6, -8.0, 7.8, -10.6),
                         gum_mat, jaw)
    L.remesh(g, 0.18, smooth=12, ratio=0.3)
    b = L.object_from_bm(f"JAW_Bone_{variant}",
                         L.heightfield_solid(lambda x, y: bone_height(x, y, ridge), -14.4, 14.4, -6.7, 6.5, -9.8),
                         bone_mat, jaw)
    L.remesh(b, 0.22, smooth=8, ratio=0.3)
    print(variant, "gum", len(g.data.polygons), L.bbox_mm(g), "bone", len(b.data.polygons), L.bbox_mm(b))
