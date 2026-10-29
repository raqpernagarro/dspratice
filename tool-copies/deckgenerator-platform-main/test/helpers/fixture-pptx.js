// test/helpers/fixture-pptx.js
// Builds a minimal-but-valid .pptx in memory: 2 slides; slide 1 has a title,
// a picture, a 2x2 table, and a grouped shape with text; slide 2 is plain.
import JSZip from "jszip";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const para = (text) => `<a:p><a:r><a:t>${text}</a:t></a:r></a:p>`;
const sp = (phType, text) =>
  `<p:sp><p:nvSpPr><p:nvPr>${phType ? `<p:ph type="${phType}"/>` : ""}</p:nvPr></p:nvSpPr>` +
  `<p:txBody>${para(text)}</p:txBody></p:sp>`;

const SLIDE1 = `<p:sld xmlns:p="p" xmlns:a="a" xmlns:r="r"><p:cSld><p:spTree>
${sp("title", "Deck title")}
${sp(null, "First bullet")}
<p:grpSp>${sp(null, "Grouped text")}</p:grpSp>
<p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill>
  <p:spPr><a:xfrm><a:ext cx="9144000" cy="5144000"/></a:xfrm></p:spPr></p:pic>
<p:graphicFrame><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
<a:tbl><a:tr><a:tc><a:txBody>${para("H1")}</a:txBody></a:tc><a:tc><a:txBody>${para("H2")}</a:txBody></a:tc></a:tr>
<a:tr><a:tc><a:txBody>${para("C1")}</a:txBody></a:tc><a:tc><a:txBody>${para("C2")}</a:txBody></a:tc></a:tr>
</a:tbl></a:graphicData></a:graphic></p:graphicFrame>
</p:spTree></p:cSld></p:sld>`;

const SLIDE2 = `<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
${sp("title", "Second slide")}${sp(null, "Only text here")}
</p:spTree></p:cSld></p:sld>`;

export async function buildFixturePptx() {
  const zip = new JSZip();
  zip.file("ppt/presentation.xml",
    `<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst>` +
    `<p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels",
    `<Relationships><Relationship Id="rId1" Type="http://schemas/slide" Target="slides/slide1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas/slide" Target="slides/slide2.xml"/></Relationships>`);
  zip.file("ppt/slides/slide1.xml", SLIDE1);
  zip.file("ppt/slides/slide2.xml", SLIDE2);
  zip.file("ppt/slides/_rels/slide1.xml.rels",
    `<Relationships><Relationship Id="rId2" Type="http://schemas/image" Target="../media/image1.png"/></Relationships>`);
  zip.file("ppt/media/image1.png", PNG_1PX);
  return zip.generateAsync({ type: "nodebuffer" });
}

// A 3-slide deck for the "remove a middle slide" scenario: slide 1 is plain,
// slide 2 (the one that gets removed) carries the picture + table, slide 3
// is plain. If a later merge keys by array position instead of original
// slide number, slide 3 will wrongly inherit slide 2's image/table once
// slide 2 is gone and slide 3 shifts into its old index.
const SLIDE1_PLAIN = `<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
${sp("title", "One")}${sp(null, "Plain text one")}
</p:spTree></p:cSld></p:sld>`;

const SLIDE2_MEDIA = `<p:sld xmlns:p="p" xmlns:a="a" xmlns:r="r"><p:cSld><p:spTree>
${sp("title", "Two")}
<p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill>
  <p:spPr><a:xfrm><a:ext cx="9144000" cy="5144000"/></a:xfrm></p:spPr></p:pic>
<p:graphicFrame><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
<a:tbl><a:tr><a:tc><a:txBody>${para("X1")}</a:txBody></a:tc></a:tr></a:tbl>
</a:graphicData></a:graphic></p:graphicFrame>
</p:spTree></p:cSld></p:sld>`;

const SLIDE3_PLAIN = `<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree>
${sp("title", "Three")}${sp(null, "Plain text three")}
</p:spTree></p:cSld></p:sld>`;

export async function buildThreeSlideFixturePptx() {
  const zip = new JSZip();
  zip.file("ppt/presentation.xml",
    `<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst>` +
    `<p:sldId id="256" r:id="rId1"/><p:sldId id="257" r:id="rId2"/><p:sldId id="258" r:id="rId3"/>` +
    `</p:sldIdLst></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels",
    `<Relationships><Relationship Id="rId1" Type="http://schemas/slide" Target="slides/slide1.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas/slide" Target="slides/slide2.xml"/>` +
    `<Relationship Id="rId3" Type="http://schemas/slide" Target="slides/slide3.xml"/></Relationships>`);
  zip.file("ppt/slides/slide1.xml", SLIDE1_PLAIN);
  zip.file("ppt/slides/slide2.xml", SLIDE2_MEDIA);
  zip.file("ppt/slides/slide3.xml", SLIDE3_PLAIN);
  zip.file("ppt/slides/_rels/slide2.xml.rels",
    `<Relationships><Relationship Id="rId2" Type="http://schemas/image" Target="../media/image1.png"/></Relationships>`);
  zip.file("ppt/media/image1.png", PNG_1PX);
  return zip.generateAsync({ type: "nodebuffer" });
}
