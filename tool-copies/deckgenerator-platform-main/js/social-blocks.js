// =============================================================================
// Social blocks — the pieces the social/* templates share, from the Master
// Slides Figma section 110:41057. The family uses the marketing chrome (Header,
// footer, PageHeader), so those blocks are re-exported. The new pieces are the
// phone mockups (Instagram post, story and profile grid, TikTok, Facebook,
// LinkedIn), the content-calendar cells and the do/don't rows. CSS is `.v2f-so-*`
// at the end of css/primitives.css.
// =============================================================================
import { esc } from "./components.js";
import { mkPhonePost } from "./marketing-blocks.js";
export { MK_FOOTER as SO_FOOTER, mkFooter as soFooter, mkCol as soCol, mkImg as soImg,
  mkPhoto as soPhoto, MK_LOREM as SO_LOREM, MK_SHORT as SO_SHORT } from "./marketing-blocks.js";

const FRAME = "assets/marketing/ig/mockup.png";
const A = (p) => `assets/social/${p}`;
const pic = (src) => (src ? `<img src="${esc(src)}" alt="">` : "");

/** Native Figma sizes of each mockup; templates scale them with `scale`. */
export const SO_SIZE = { post: [404, 832], story: [404, 832], tiktok: [404, 832], grid: [788, 1616], facebook: [440, 908], linkedin: [440, 908] };

/** The phone kinds a slide can switch between, with the label Figma gives each. */
export const SO_KINDS = { post: "Instagram post", story: "Instagram story", tiktok: "TikTok post" };

const box = (kind, scale, inner) => {
  const [w, h] = SO_SIZE[kind];
  return `<div class="v2f-so-box" style="width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px;">
    <div class="v2f-so-ph v2f-so-${kind}" style="width:${w}px;height:${h}px;transform:scale(${scale});">
      <div class="scr">${inner}</div><img class="frm" src="${FRAME}" alt="">
    </div></div>`;
};

/** Instagram story (Figma InstagramStory): full-screen image, three progress bars, avatar and handle. */
const story = (image, { user = "username" } = {}) => `
  <div class="pic">${pic(image)}</div>
  <div class="hd"><div class="bars"><i></i><i></i><i></i></div>
    <div class="usr"><span class="av">${pic(image)}</span><span>${esc(user)}</span><span>2h</span></div></div>`;

/** TikTok post (Figma TikTokPost): image over a dark screen, feed tabs, caption, side actions, tab bar. */
const T = (p) => A(`tiktok/${p}`);
const tiktok = (image, { user = "@username", caption = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do" } = {}) => `
  <div class="pic">${pic(image)}</div>
  <div class="ui">
    <p class="t fol">Following</p><p class="t fy">For You</p><span class="sep"><img src="${T("tabs-sep.svg")}" alt=""></span>
    <p class="t un">${esc(user)}</p><p class="t cap">${esc(caption)}</p><p class="t song">Song – @artist</p><span class="note"><img src="${T("note.svg")}" alt=""></span>
    <span class="ava"><img src="${T("avatar-ring.png")}" alt=""></span><span class="fol1"><img src="${T("follow.svg")}" alt=""></span><span class="fol2"><img src="${T("follow-plus.svg")}" alt=""></span>
    <span class="like"><img src="${T("like.svg")}" alt=""></span><p class="n n1">1.3M</p>
    <span class="cmt"><img src="${T("comment.svg")}" alt=""></span><p class="n n2">10.7M</p>
    <span class="shr"><img src="${T("share.svg")}" alt=""></span><p class="n n3">30.9K</p>
    <span class="d1"><img src="${T("disc-outer.png")}" alt=""></span><span class="d2"><img src="${T("disc-inner.png")}" alt=""></span>
    <span class="m1"><img src="${T("note2.svg")}" alt=""></span><span class="m2"><img src="${T("note3.svg")}" alt=""></span><span class="m3"><img src="${T("note4.svg")}" alt=""></span>
    <span class="bar"><img src="${T("navbar.svg")}" alt=""></span>
    <span class="i home"><img src="${T("home.svg")}" alt=""></span><p class="l home">Home</p>
    <span class="i disc"><img src="${T("discover.svg")}" alt=""></span><p class="l disc">Discover</p>
    <span class="i add"><img src="${T("add.svg")}" alt=""></span>
    <span class="i inbox"><img src="${T("inbox.svg")}" alt=""></span><p class="l inbox">Inbox</p>
    <span class="i me1"><img src="${T("me-body.svg")}" alt=""></span><span class="i me2"><img src="${T("me-head.svg")}" alt=""></span><p class="l me">Me</p>
    <span class="hb"><img src="${T("homebar.svg")}" alt=""></span>
  </div>`;

/** Instagram profile grid (Figma InstagramGrid): profile tabs, a 3×5 grid of posts, tab bar. */
const G = (p) => A(`iggrid/${p}`);
const grid = (images = []) => `
  <div class="tabs"><span class="on"><img src="${G("grid.svg")}" alt=""></span><span><img src="${G("reels.svg")}" alt=""></span><span><img src="${G("tag.svg")}" alt=""></span></div>
  <div class="gr">${[0, 1, 2, 3, 4].map((r) => `<div class="row">${[0, 1, 2].map((c) => `<div class="cell">${pic(images[(r * 3 + c) % Math.max(images.length, 1)])}</div>`).join("")}</div>`).join("")}</div>
  <div class="tabbar"><div class="nt"><img src="${G("home.svg")}" alt=""><img src="${G("search.svg")}" alt=""><img src="${G("add.svg")}" alt=""><img src="${G("reels.svg")}" alt=""><span class="me">${pic(images[0])}</span></div><i class="hb"></i></div>`;

const CAPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore...";

/** Facebook post (Figma FacebookPost): back, avatar with name and "Sponsored", caption, image, link card with CTA, comment bar. */
const F = (p) => A(`fb/${p}`);
const facebook = (image, { user = "Username", caption = CAPTION, site = "website.com", headline = "Lorem ipsum", cta = "CTA" } = {}) => `
  <div class="post">
    <div class="usr"><img class="bk" src="${F("back.svg")}" alt=""><span class="who"><span class="av">${pic(image)}</span><span class="nm"><b>${esc(user)}</b><i>Sponsored</i></span></span><img class="more" src="${F("more.svg")}" alt=""></div>
    <p class="desc">${esc(caption)}</p>
    <div class="pic">${pic(image)}</div>
    <div class="cta"><div class="tx"><p class="s">${esc(site)}</p><p class="n">${esc(headline)}</p></div><span class="b">${esc(cta)}</span></div>
  </div>
  <div class="cmt"><div class="r"><img src="${F("camera.svg")}" alt=""><span class="in"><img src="${F("sticker.svg")}" alt=""><img src="${F("gif.svg")}" alt=""><img src="${F("emoji.svg")}" alt=""></span></div><i class="hb"></i></div>`;

/** LinkedIn post (Figma LinkedInPost): search header, sponsored post with CTA strip and actions, the next post peeking in, tab bar. */
const L = (p) => A(`li/${p}`);
const liPost = (image, { user, caption, headline, cta }) => `
    <div class="post">
      <div class="usr"><span class="lg">${pic(image)}</span><span class="nm"><b>${esc(user)}</b><i>1 000 followers</i><i>Sponsored</i></span><img src="${L("options.svg")}" alt=""></div>
      <p class="desc">${esc(caption)}</p>
      <div class="pic">${pic(image)}</div>
      <div class="cta"><p>${esc(headline)}</p><span>${esc(cta)}</span></div>
    </div>
    <div class="act"><span class="me"><span class="av">${pic(image)}</span><img src="${L("caret.svg")}" alt=""></span>
      ${[["like", "Like"], ["comment", "Comment"], ["repost", "Repost"], ["send", "Send"]].map(([i, l]) => `<span class="abtn"><img src="${L(i + ".svg")}" alt=""><b>${l}</b></span>`).join("")}</div>`;
const linkedin = (image, { user = "Username", caption = CAPTION, headline = "Lorem ipsum", cta = "CTA" } = {}) => `
  <div class="hdr"><span class="av">${pic(image)}</span><span class="srch"><img src="${L("search.svg")}" alt=""></span><img class="msg" src="${L("message.svg")}" alt=""></div>
  <div class="body">${liPost(image, { user, caption, headline, cta })}${liPost(image, { user, caption, headline, cta })}</div>
  <div class="tabbar"><div class="nt">${[["home", "Home"], ["network", "My Network"], ["post", "Post"], ["bell", "Notifications"], ["jobs", "Jobs"]].map(([i, l], k) => `<span${k ? "" : ' class="on"'}><img src="${L(i + ".svg")}" alt=""><b>${l}</b></span>`).join("")}</div><i class="hb"></i></div>`;

/**
 * Phone mockup of the given kind at `scale` of its Figma size (SO_SIZE).
 * `image` is the post image (an array of images for `grid`); `opts` passes the
 * handle or link-card copy through to the mockup.
 */
export const soPhone = (kind = "post", image, { scale = 1, ...opts } = {}) => {
  if (kind === "post") return mkPhonePost(image, { scale, ...opts });
  if (kind === "story") return box("story", scale, story(image, opts));
  if (kind === "tiktok") return box("tiktok", scale, tiktok(image, opts));
  if (kind === "grid") return box("grid", scale, grid(Array.isArray(image) ? image : [image]));
  if (kind === "facebook") return box("facebook", scale, facebook(image, opts));
  if (kind === "linkedin") return box("linkedin", scale, linkedin(image, opts));
  return "";
};

/** Accept only the phone kinds a template offers; fall back to its default. */
export const soKind = (k, allowed, dflt) => (allowed.includes(k) ? k : dflt);

/**
 * Social PageHeader (Figma PageHeader in the social frames): a 36/44 eyebrow at
 * 25% over a 36/44 title. `small` gives the 24/32 eyebrow at 50% the row
 * frames use. `body` adds the 24/32 paragraph at 60%; `bottom` pins it to the
 * foot of the column.
 */
export const soHead = ({ eyebrow, title, body } = {}, { small = false, bottom = false } = {}) => `
  <div class="v2f-so-head${small ? " small" : ""}${bottom ? " bottom" : ""}">
    <div class="hd">${eyebrow ? `<p class="e">${esc(eyebrow)}</p>` : ""}${title ? `<p class="t">${esc(title)}</p>` : ""}</div>
    ${body ? `<p class="par">${esc(body)}</p>` : ""}
  </div>`;

/** Large PageHeader (cover, text-01): 20/28 caption over a 60/68 title and a 25% subtitle, optional 24/32 paragraph. */
export const soBigHead = ({ caption, title, subtitle, body } = {}, { bottom = false } = {}) => `
  <div class="v2f-so-big${bottom ? " bottom" : ""}">
    <div class="hd">${caption ? `<p class="c">${esc(caption)}</p>` : ""}${title ? `<p class="t">${esc(title)}</p>` : ""}${subtitle ? `<p class="t m">${esc(subtitle)}</p>` : ""}</div>
    ${body ? `<p class="par">${esc(body)}</p>` : ""}
  </div>`;

/** Do/don't row (Figma TextBlock/Social): a check or cross icon, a title and a 50% line. */
export const soRule = (r = {}, tone = "do") => `
  <div class="v2f-so-rule"><img src="${A(tone === "dont" ? "cross.svg" : "check.svg")}" alt="">
    <div><p>${esc(r.title ?? "")}</p><p class="m">${esc(r.text ?? "")}</p></div></div>`;

/** Label + value pair (Figma TextBlock, 24/32 over 24/32 at 50%). */
export const soField = (f = {}) => `
  <div class="v2f-so-field"><p>${esc(f.label ?? "")}</p><p class="m">${esc(f.value ?? "")}</p></div>`;

/** Phone with a caption under it (Figma ScreenTitle): 20/28 title, 18/28 line at 60%. */
export const soScreen = (kind, it = {}, scale = 0.689) => `
  <div class="v2f-so-scr">${soPhone(kind, it.image, { scale })}
    <div class="tx"><p>${esc(it.title ?? "")}</p><p class="m">${esc(it.text ?? "")}</p></div></div>`;

/** Weekly-calendar cell (Figma Calendar, topic form): 20/28 topic over a 50% line on the 5% tint. */
export const soDay = (d = {}) => `
  <div class="v2f-so-day"><p>${esc(d.topic ?? "")}</p><p class="m">${esc(d.text ?? "")}</p></div>`;

/** Monthly-calendar cell (Figma Calendar, image form): the date and an image on the 5% tint. */
export const soDate = (n, image) => `
  <div class="v2f-so-date"><span>${esc(String(n))}</span><div class="pic">${pic(image)}</div></div>`;
