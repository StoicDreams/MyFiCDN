// More Web UI icons, filling in what large icon packs commonly include. Same style and format as icons.mjs.

import { P, line, polyline, polygon, rect, circle, ellipse, dot, arc, move, rotate, scale, mirror, transform } from './lib.mjs';
import {
    at, head, curvedArrow, bi, tri, box, ring, personHead, shoulders, bubble, docShape, docFold, speaker, play,
    smooth, sparkle,
} from './parts.mjs';

const flipY = path => transform(path, ([x, y]) => [x, -y]);
const rays = (count, r0, r1, offset = 0) => Array.from({ length: count }, (_, i) => line(...at(0, 0, r0, offset + (360 / count) * i), ...at(0, 0, r1, offset + (360 / count) * i)));

// Small marks placed at the lower right, beside a main shape, such as the plus in user-plus.
const markPlus = (x = 48, y = 30, s = 18) => [bi(line(x, y - s, x, y + s)), bi(line(x - s, y, x + s, y))];
const markMinus = (x = 48, y = 30, s = 18) => [bi(line(x - s, y, x + s, y))];
const markCheck = (x = 48, y = 30) => [bi(polyline([[x - 20, y], [x - 6, y + 14], [x + 20, y - 14]]))];
const markX = (x = 48, y = 30, s = 15) => [bi(line(x - s, y - s, x + s, y + s)), bi(line(x - s, y + s, x + s, y - s))];

// A person shifted left and made smaller, leaving room for a mark.
const smallPerson = () => [personHead(-22, -34, 24), shoulders(-22, 8, 46, 62)];

// Shared shapes.
const folderShape = () => polygon([[-68, -48, 10], [-18, -48, 10], [-4, -32, 0], [68, -32, 10], [68, 56, 10], [-68, 56, 10]]);
const calendarParts = () => [rect(-64, -50, 64, 64, 12), line(-30, -68, -30, -36), line(30, -68, 30, -36), bi(line(-64, -14, 64, -14))];
const clipboardParts = () => [rect(-54, -54, 54, 68, 12), bi(rect(-24, -70, 24, -40, 8))];
const cloudShape = (dy = 0) => move(P(-40, 50).A(-40, 22, 28, 90, 270, 90).A(4, -10, 40, 200, 340, 90).A(42, 20, 30, 300, 450, 90).close(), 0, dy);
const smallCloud = () => scale(move(P(-40, 50).A(-40, 22, 28, 90, 270, 90).A(4, -10, 40, 200, 340, 90).A(42, 20, 30, 300, 450, 90).close(), 0, -8), 0.92);
const face = () => [ring(), bi(dot(-24, -18)), bi(dot(24, -18))];
const heartShape = () => P(0, 62).Q(-74, 8, -68, -28).Q(-62, -66, -26, -62).Q(-8, -60, 0, -42).Q(8, -60, 26, -62).Q(62, -66, 68, -28).Q(74, 8, 0, 62);
const microphone = () => [rect(-24, -68, 24, 18, 24), bi(P(-46, -6).Q(-46, 42, 0, 42).Q(46, 42, 46, -6).end()), bi(line(0, 42, 0, 66)), bi(line(-26, 66, 26, 66))];
const bellShape = () => P(-62, 40).Q(-46, 28, -46, -6).Q(-46, -58, 0, -58).Q(46, -58, 46, -6).Q(46, 28, 62, 40).close();
const leftBrace = () => P(-18, -64).Q(-40, -64, -40, -42).L(-40, -16).Q(-40, 0, -58, 0).Q(-40, 0, -40, 16).L(-40, 42).Q(-40, 64, -18, 64).end();
const textLines = widths => widths.map(([x0, x1], i) => line(x0, -48 + i * 32, x1, -48 + i * 32));
const gitDot = (x, y) => circle(x, y, 14);
const wheel = (x, y, r = 14) => bi(circle(x, y, r));

export const MORE = [
    ['arrows-left-right', 'horizontal resize width swap', line(-64, 0, 64, 0), head(-66, 0, 180, 36), head(66, 0, 0, 36)],
    ['arrows-move', 'move drag position pan', line(-66, 0, 66, 0), line(0, -66, 0, 66), head(-68, 0, 180, 26), head(68, 0, 0, 26), head(0, -68, -90, 26), head(0, 68, 90, 26)],
    ['chevrons-right', 'double angle forward last', polyline([[-48, -48], [-4, 0], [-48, 48]]), polyline([[4, -48], [48, 0], [4, 48]])],
    ['arrow-turn-down-left', 'return enter reply', polyline([[60, -58], [60, 10], [-56, 10]], 14), head(-60, 10, 180, 36)],
    ['shuffle', 'random mix', polyline([[-68, -40], [-34, -40], [26, 40], [62, 40]], 10), head(64, 40, 0, 26), polyline([[-68, 40], [-34, 40], [26, -40], [62, -40]], 10), head(64, -40, 0, 26)],
    ['repeat', 'loop again cycle', polyline([[-62, 14], [-62, -30], [54, -30]], 14), head(58, -30, 0, 26), polyline([[62, -14], [62, 30], [-54, 30]], 14), head(-58, 30, 180, 26)],
    ['trending-up', 'growth increase chart rise', polyline([[-68, 42], [-20, -6], [8, 22], [62, -32]]), polyline([[22, -34], [64, -34], [64, 8]])],

    // Media
    ['forward', 'next skip media track', polygon([[-50, -50], [26, 0], [-50, 50]], 10), bi(line(54, -50, 54, 50))],
    ['fast-forward', 'media speed skip', polygon([[-68, -46], [-6, 0], [-68, 46]], 8), polygon([[2, -46], [64, 0], [2, 46]], 8)],
    ['volume-low', 'sound quiet audio', speaker(), bi(arc(4, 0, 34, -50, 50))],
    ['headphones', 'audio music listen headset', bi(arc(0, 12, 58, 180, 360)), rect(-70, 4, -38, 64, 10), rect(38, 4, 70, 64, 10)],
    ['film', 'movie video cinema', rect(-58, -68, 58, 68, 10), bi(line(-28, -68, -28, 68)), bi(line(28, -68, 28, 68)), bi(line(-58, 0, -28, 0)), bi(line(28, 0, 58, 0))],
    ['images', 'pictures photos gallery album', rect(-48, -60, 70, 36, 10), bi(polyline([[-48, 26], [-6, -12], [24, 16], [40, 2], [70, 28]])), polyline([[-70, -36], [-70, 60], [46, 60]], 10)],

    // Devices
    ['desktop', 'monitor computer screen display', rect(-70, -58, 70, 30, 10), bi(line(0, 30, 0, 60)), bi(line(-32, 62, 32, 62))],
    ['tv', 'television screen display', rect(-70, -38, 70, 60, 12), bi(polyline([[-30, -68], [0, -38], [30, -68]]))],
    ['laptop', 'computer notebook', rect(-54, -56, 54, 22, 8), bi(polygon([[-54, 22], [54, 22], [72, 54], [-72, 54]], 6))],
    ['tablet', 'ipad device screen', rect(-52, -68, 52, 68, 12), bi(line(-8, 50, 8, 50))],
    ['watch', 'smartwatch time wrist', rect(-36, -38, 36, 38, 14), polyline([[-24, -38], [-20, -68], [20, -68], [24, -38]]), polyline([[-24, 38], [-20, 68], [20, 68], [24, 38]]), bi(polyline([[0, -18], [0, 0], [14, 10]]))],
    ['keyboard', 'type input keys', rect(-72, -42, 72, 42, 10), ...[-44, -14, 16, 46].map(x => bi(dot(x, -14))), bi(line(-32, 18, 32, 18))],
    ['mouse', 'computer click pointer device', rect(-38, -66, 38, 66, 38), bi(line(0, -66, 0, -26))],
    ['gamepad', 'game controller play', P(-40, -36).L(40, -36).Q(70, -36, 72, 0).L(72, 24).Q(72, 48, 52, 48).Q(40, 48, 30, 30).L(-30, 30).Q(-40, 48, -52, 48).Q(-72, 48, -72, 24).L(-72, 0).Q(-70, -36, -40, -36),
        bi(line(-50, -2, -22, -2)), bi(line(-36, -16, -36, 12)), bi(dot(28, -10)), bi(dot(46, 6))],
    ['print-screen', 'screenshot capture', polyline([[-66, -24], [-66, -66], [-24, -66]]), polyline([[24, -66], [66, -66], [66, -24]]), polyline([[66, 24], [66, 66], [24, 66]]), polyline([[-24, 66], [-66, 66], [-66, 24]]), bi(circle(0, 0, 22))],
    ['plug', 'power electric connect', rect(-40, -26, 40, 22, 10), bi(line(-18, -26, -18, -66)), bi(line(18, -26, 18, -66)), bi(P(0, 22).Q(0, 46, -18, 54).Q(-34, 62, -34, 70).end())],
    ['microchip', 'cpu processor chip hardware', rect(-44, -44, 44, 44, 10), bi(rect(-18, -18, 18, 18, 4)), ...[-20, 20].flatMap(v => [line(v, -44, v, -66), line(v, 44, v, 66), line(-44, v, -66, v), line(44, v, 66, v)])],
    ['signal', 'bars strength network reception', line(-54, 60, -54, 32), line(-18, 60, -18, 8), line(18, 60, 18, -18), line(54, 60, 54, -46)],
    ['bluetooth', 'wireless connect', polyline([[-34, -32], [32, 28], [0, 58], [0, -58], [32, -28], [-34, 32]])],

    // Files and documents
    ['folder-open', 'directory browse open', bi(polyline([[-68, 52], [-68, -48], [-18, -48], [-4, -32], [52, -32], [52, -12]], 8)), polygon([[-68, 52], [-44, -12], [72, -12], [48, 52]], 8)],
    ['folder-plus', 'new directory add', folderShape(), ...markPlus(0, 12, 20)],
    ['box-archive', 'archive storage box', rect(-70, -62, 70, -30, 8), polyline([[-60, -30], [-60, 60], [60, 60], [60, -30]], 10), bi(line(-18, -6, 18, -6))],
    ['inbox', 'messages tray mail', rect(-68, -60, 68, 60, 12), bi(polyline([[-68, 14], [-30, 14], [-18, 32], [18, 32], [30, 14], [68, 14]]))],
    ['cube', 'box package 3d product', polygon([[0, -70], [64, -36], [64, 36], [0, 70], [-64, 36], [-64, -36]]), bi(polyline([[-64, -36], [0, -2], [64, -36]])), bi(line(0, -2, 0, 70))],
    ['package', 'box delivery shipping cube', polygon([[0, -70], [64, -36], [64, 36], [0, 70], [-64, 36], [-64, -36]]), bi(polyline([[-64, -36], [0, -2], [64, -36]])), bi(line(0, -2, 0, 70)), tri(line(-32, -53, 32, -19))],
    ['book-open', 'read reading documentation manual', P(0, -44).Q(-30, -62, -70, -56).L(-70, 48).Q(-30, 42, 0, 62).Q(30, 42, 70, 48).L(70, -56).Q(30, -62, 0, -44), bi(line(0, -44, 0, 62))],
    ['newspaper', 'news article blog', rect(-66, -60, 66, 60, 12), bi(rect(-42, -36, -4, -2, 4)), bi(line(14, -30, 42, -30)), bi(line(14, -8, 42, -8)), bi(line(-42, 24, 42, 24))],
    ['note-sticky', 'sticky note memo post', polygon([[-64, -64, 12], [64, -64, 12], [64, 20, 0], [20, 64, 0], [-64, 64, 12]]), bi(polyline([[64, 20], [20, 20], [20, 64]]))],
    ['receipt', 'bill invoice purchase', polygon([[-50, -68, 10], [50, -68, 10], [50, 64, 0], [25, 48, 0], [0, 64, 0], [-25, 48, 0], [-50, 64, 0]]), bi(line(-26, -36, 26, -36)), bi(line(-26, -10, 26, -10)), bi(line(-26, 16, 8, 16))],
    ['clipboard-check', 'task done list complete', ...clipboardParts(), bi(polyline([[-26, 10], [-6, 30], [28, -6]]))],
    ['clipboard-list', 'tasks checklist todo', ...clipboardParts(), bi(line(-26, -10, 26, -10)), bi(line(-26, 14, 26, 14)), bi(line(-26, 38, 10, 38))],
    ['calendar-check', 'date done event confirmed', ...calendarParts(), bi(polyline([[-24, 22], [-6, 40], [26, 8]]))],
    ['calendar-plus', 'date add new event', ...calendarParts(), bi(line(0, 6, 0, 46)), bi(line(-20, 26, 20, 26))],
    ['calendar-days', 'date month schedule', ...calendarParts(), ...[[-34, 12], [0, 12], [34, 12], [-34, 40], [0, 40]].map(([x, y]) => bi(dot(x, y)))],

    // Editing and text
    ['scissors', 'cut clip', circle(-40, 42, 18), circle(40, 42, 18), bi(line(-28, 28, 46, -64)), bi(line(28, 28, -46, -64))],
    ['crop', 'trim cut image', polyline([[-40, -70], [-40, 40], [70, 40]]), polyline([[-70, -40], [40, -40], [40, 70]])],
    ['font', 'text type letter typography', polyline([[-56, -44], [-56, -64], [56, -64], [56, -44]]), line(0, -64, 0, 64), line(-22, 64, 22, 64)],
    ['bold', 'text strong weight', ['14', P(-38, 0).L(-38, -62).L(8, -62).A(8, -31, 31, -90, 90).L(-38, 0)], ['14', P(-38, 0).L(14, 0).A(14, 31, 31, -90, 90).L(-38, 62).L(-38, 0)]],
    ['italic', 'text slant emphasis', line(-6, -62, 50, -62), line(-50, 62, 6, 62), line(22, -62, -22, 62)],
    ['underline', 'text', P(-40, -64).L(-40, -8).A(0, -8, 40, 180, 0).L(40, -64).end(), bi(line(-54, 66, 54, 66))],
    ['strikethrough', 'text delete cross out', P(44, -38).Q(36, -56, 2, -56).Q(-44, -56, -44, -28).Q(-44, -2, 0, 0).Q(46, 2, 46, 30).Q(46, 58, -2, 58).Q(-36, 58, -46, 40).end(), bi(line(-66, 0, 66, 0))],
    ['align-left', 'text paragraph', ...textLines([[-62, 62], [-62, 26], [-62, 62], [-62, 26]])],
    ['align-center', 'text paragraph', ...textLines([[-62, 62], [-38, 38], [-62, 62], [-38, 38]])],
    ['align-right', 'text paragraph', ...textLines([[-62, 62], [-26, 62], [-62, 62], [-26, 62]])],
    ['align-justify', 'text paragraph', ...textLines([[-62, 62], [-62, 62], [-62, 62], [-62, 62]])],
    ['list-check', 'checklist tasks todo', bi(polyline([[-66, -46], [-56, -36], [-38, -54]])), bi(polyline([[-66, 0], [-56, 10], [-38, -8]])), bi(polyline([[-66, 46], [-56, 56], [-38, 38]])), line(-16, -44, 64, -44), line(-16, 2, 64, 2), line(-16, 48, 64, 48)],
    ['table', 'grid spreadsheet excel data rows', rect(-68, -56, 68, 56, 10), bi(line(-68, -18, 68, -18)), bi(line(-68, 18, 68, 18)), bi(line(-22, -18, -22, 56)), bi(line(22, -18, 22, 56))],
    ['table-columns', 'layout columns split', rect(-68, -56, 68, 56, 10), bi(line(0, -56, 0, 56))],
    ['wand', 'magic effect auto', line(-62, 62, 22, -22), bi(sparkle(42, -42, 26)), tri(sparkle(-26, -46, 14))],
    ['sparkles', 'magic shine new ai', sparkle(-14, 10, 56), bi(sparkle(44, -44, 22)), tri(sparkle(44, 48, 14))],
    ['paintbrush', 'paint art brush design', rotate(rect(-14, -70, 14, 14, 6), 35), bi(rotate(P(-16, 22).Q(-26, 60, -2, 64).Q(20, 66, 16, 22).end(), 35))],
    ['palette', 'colors art paint design', smooth([[0, -68], [64, -60], [70, 6], [40, 30], [20, 40], [30, 68], [-38, 66], [-70, 20], [-62, -44]]), bi(dot(-30, -30, 4)), bi(dot(8, -40, 4)), bi(dot(40, -20, 4)), bi(dot(-36, 16, 4))],
    ['eraser', 'erase remove clean', rotate(rect(-58, -26, 58, 26, 8), -45), bi(rotate(line(-6, -26, -6, 26), -45)), line(-14, 66, 66, 66)],

    ['spinner', 'loading wait busy progress', ...rays(8, 30, 64, -90).map((path, i) => (i % 2 ? bi(path) : path))],
    ['hourglass', 'wait time loading sand', P(-44, -64).L(44, -64).L(44, -50).Q(44, -20, 10, 0).Q(44, 20, 44, 50).L(44, 64).L(-44, 64).L(-44, 50).Q(-44, 20, -10, 0).Q(-44, -20, -44, -50).close(), bi(line(-26, 50, 26, 50))],
    ['thumbtack', 'pin attach stick', polygon([[-30, -66, 6], [30, -66, 6], [22, -30, 0], [46, 6, 6], [-46, 6, 6], [-22, -30, 0]]), bi(line(0, 6, 0, 70))],
    ['window', 'browser app screen', rect(-68, -58, 68, 58, 12), bi(line(-68, -26, 68, -26)), bi(dot(-48, -42)), bi(dot(-30, -42))],
    ['gauge', 'dashboard speed meter performance', arc(0, 22, 66, 180, 360), bi(line(0, 22, 36, -16)), bi(dot(0, 22, 4)), line(-66, 22, -66, 40), line(66, 22, 66, 40)],
    ['power', 'off on shutdown start', arc(0, 6, 58, -55, 235), line(0, -70, 0, -8)],
    ['history', 'recent past clock rotate', ...curvedArrow(0, 0, 64, 160, -170), bi(polyline([[0, -34], [0, 0], [26, 18]]))],
    ['stopwatch', 'timer time clock', circle(0, 10, 58), line(-18, -66, 18, -66), line(0, -66, 0, -48), bi(line(0, 10, 0, -22))],
    ['arrow-pointer', 'cursor mouse select click', polygon([[-38, -66, 4], [42, 10, 4], [6, 16, 0], [28, 58, 0], [14, 66, 0], [-8, 24, 0], [-38, 48, 4]])],
    ['hashtag', 'hash number tag pound', line(-26, -64, -40, 64), line(40, -64, 26, 64), line(-62, -24, 66, -24), line(-66, 24, 62, 24)],
    ['at', 'email mention address', bi(circle(0, 0, 24)), P(24, -26).L(24, 10).Q(24, 30, 42, 30).Q(64, 30, 64, 0).A(0, 0, 64, 360, 110).end()],
    ['percent', 'discount sale ratio', bi(line(-50, 60, 50, -60)), circle(-38, -38, 16), circle(38, 38, 16)],
    ['infinity', 'forever loop unlimited', smooth(Array.from({ length: 10 }, (_, i) => {
        const t = (Math.PI * 2 * i) / 10, d = 1 + Math.sin(t) ** 2;
        return [(72 * Math.cos(t)) / d, (72 * Math.sin(t) * Math.cos(t)) / d];
    }))],
    // The ring is drawn as a line, so a filled crosshair stays a crosshair rather than a solid disc.
    ['crosshairs', 'target aim focus location', arc(0, 0, 50, -90, 270), bi(line(0, -70, 0, -26)), bi(line(0, 26, 0, 70)), bi(line(-70, 0, -26, 0)), bi(line(26, 0, 70, 0))],
    ['bullseye', 'target goal aim focus', ring(), bi(circle(0, 0, 42)), tri(circle(0, 0, 14))],
    ['eye-dropper', 'color picker sample', rotate(rect(-12, -40, 12, 40, 6), 45), rotate(rect(-26, -64, 26, -40, 8), 45), bi(rotate(line(0, 40, 0, 70), 45))],

    // Code and technology
    ['brackets-curly', 'code json object braces', leftBrace(), mirror(leftBrace())],
    ['bug', 'error issue debug insect', ellipse(0, 10, 34, 50), bi(line(0, -28, 0, 58)), arc(0, -38, 20, 200, 340),
        line(-34, -6, -64, -20), line(-34, 18, -66, 18), line(-30, 40, -60, 58), line(34, -6, 64, -20), line(34, 18, 66, 18), line(30, 40, 60, 58)],
    ['code-branch', 'git branch version fork', gitDot(-34, -50), gitDot(-34, 50), gitDot(36, -26), line(-34, -36, -34, 36), bi(P(36, -12).Q(36, 22, -28, 34).end())],
    ['code-commit', 'git commit version', circle(0, 0, 24), bi(line(-70, 0, -24, 0)), bi(line(24, 0, 70, 0))],
    ['code-merge', 'git merge pull request', gitDot(-34, -50), gitDot(-34, 50), gitDot(36, 26), line(-34, -36, -34, 36), bi(P(-30, -38).Q(-10, 14, 22, 24).end())],
    ['qrcode', 'qr scan code', rect(-66, -66, -14, -14, 6), rect(14, -66, 66, -14, 6), rect(-66, 14, -14, 66, 6), bi(dot(-40, -40, 4)), bi(dot(40, -40, 4)), bi(dot(-40, 40, 4)), bi(rect(14, 14, 32, 32, 2)), bi(rect(48, 48, 66, 66, 2)), bi(line(48, 14, 66, 14)), bi(line(14, 66, 30, 66))],
    ['barcode', 'scan product code', ...[[-62, 0], [-44, 0], [-30, 1], [-10, 0], [6, 1], [24, 0], [42, 1], [62, 0]].map(([x, shade]) => (shade ? bi(line(x, -56, x, 56)) : line(x, -56, x, 56)))],
    ['fingerprint', 'biometric identity security touch', arc(0, 10, 66, 200, 340), arc(0, 10, 48, 190, 360), arc(0, 10, 30, 180, 400), line(0, 10, 0, 64), bi(P(30, 10).Q(30, 50, 14, 66).end()), bi(P(-48, 10).Q(-48, 46, -30, 66).end()), bi(P(48, 10).Q(48, 40, 40, 58).end())],

    // People
    ['user-plus', 'add person invite new account', ...smallPerson(), ...markPlus()],
    ['user-minus', 'remove person', ...smallPerson(), ...markMinus()],
    ['user-check', 'verified person approved', ...smallPerson(), ...markCheck()],
    ['user-xmark', 'remove person block', ...smallPerson(), ...markX()],
    ['id-card', 'identity badge license profile', rect(-70, -50, 70, 50, 10), bi(circle(-30, -10, 14)), bi(P(-52, 30).Q(-46, 10, -30, 10).Q(-14, 10, -8, 30).end()), bi(line(12, -16, 50, -16)), bi(line(12, 10, 50, 10))],
    ['face-smile', 'happy emoji good', ...face(), bi(arc(0, 6, 34, 20, 160))],
    ['face-frown', 'sad emoji bad', ...face(), bi(arc(0, 46, 30, 200, 340))],
    ['face-meh', 'neutral emoji', ...face(), bi(line(-26, 26, 26, 26))],
    ['paw', 'pet animal dog cat', smooth([[0, 4], [36, 34], [26, 62], [0, 54], [-26, 62], [-36, 34]]), bi(circle(-50, -6, 13)), bi(circle(-22, -42, 14)), bi(circle(22, -42, 14)), bi(circle(50, -6, 13))],

    // Communication
    ['reply', 'answer respond back', P(66, 54).Q(66, -10, 4, -10).L(-58, -10).end(), head(-62, -10, 180, 36)],
    ['share-from-square', 'share export forward', polyline([[-8, -60], [-60, -60], [-60, 60], [60, 60], [60, 12]], 12), P(-18, 22).Q(-18, -26, 30, -26).L(58, -26).end(), bi(head(62, -26, 0, 26))],
    ['comment-dots', 'chat typing message', bubble(), bi(dot(-30, -14, 4)), bi(dot(0, -14, 4)), bi(dot(30, -14, 4))],
    ['bullhorn', 'megaphone announce marketing', polygon([[-60, -18, 6], [-22, -18, 0], [50, -58, 6], [50, 58, 6], [-22, 18, 0], [-60, 18, 6]]), bi(line(-40, 18, -30, 56))],
    ['rss', 'feed subscribe blog', dot(-50, 50, 4), arc(-56, 56, 46, -90, 0), arc(-56, 56, 86, -90, 0)],
    ['phone-handset', 'call telephone contact', P(-56, -64).L(-32, -68).L(-16, -34).L(-34, -18).Q(-18, 18, 18, 34).L(34, 16).L(68, 32).L(64, 56).Q(60, 70, 40, 68).Q(-64, 48, -68, -40).Q(-70, -60, -56, -64)],
    ['address-book', 'contacts people directory', rect(-52, -68, 62, 68, 10), bi(circle(6, -14, 16)), bi(P(-20, 34).Q(-14, 8, 6, 8).Q(26, 8, 32, 34).end()), line(-66, -36, -52, -36), line(-66, 0, -52, 0), line(-66, 36, -52, 36)],

    // Nature and weather
    ['snowflake', 'winter cold snow freeze', ...[0, 60, 120].map(deg => rotate(line(0, -68, 0, 68), deg)), ...[0, 60, 120, 180, 240, 300].map(deg => bi(rotate(polyline([[-16, -64], [0, -48], [16, -64]]), deg)))],
    ['umbrella', 'rain weather protection insurance', P(-70, 0).A(0, 0, 70, 180, 360).close(), bi(line(0, 0, 0, 52)), bi(arc(-14, 52, 14, 0, 180))],
    ['wind', 'weather air breeze', P(-66, -22).L(28, -22).A(28, -42, 20, 90, -150).end(), P(-66, 4).L(44, 4).A(44, 24, 20, -90, 150).end(), bi(line(-66, 30, 4, 30))],
    ['temperature', 'thermometer weather heat', P(-14, 24).L(-14, -52).A(0, -52, 14, 180, 360, 90).L(14, 24).A(0, 44, 24, -54, 234, 90).close(), bi(line(0, -26, 0, 44))],
    ['droplet', 'water liquid drop', P(0, -70).Q(54, -10, 54, 22).A(0, 22, 54, 0, 180).Q(-54, -10, 0, -70)],
    ['fire', 'flame hot burn popular', P(0, 70).Q(-54, 66, -54, 22).Q(-54, -14, -18, -44).Q(-14, -14, 0, -12).Q(4, -50, 22, -70).Q(56, -30, 54, 20).Q(54, 66, 0, 70), bi(P(0, 70).Q(-24, 66, -24, 44).Q(-24, 22, 0, 8).Q(24, 22, 24, 44).Q(24, 66, 0, 70))],
    ['leaf', 'nature eco plant green', P(-56, 56).Q(-60, -56, 62, -62).Q(56, 58, -56, 56), bi(line(-56, 56, 26, -26))],
    ['tree', 'nature forest pine', polygon([[0, -70, 6], [44, -6, 0], [22, -6, 0], [56, 40, 6], [-56, 40, 6], [-22, -6, 0], [-44, -6, 0]]), bi(line(0, 40, 0, 68))],
    ['mountain', 'landscape nature outdoors', polygon([[-70, 56], [-22, -34], [4, 8], [26, -16], [70, 56]], 6)],
    ['seedling', 'grow plant start sprout', line(0, 66, 0, -6), P(0, -6).Q(-6, -56, -58, -56).Q(-58, -6, 0, -6), bi(P(0, 14).Q(6, -30, 54, -30).Q(54, 14, 0, 14))],
    ['sun-cloud', 'weather partly cloudy', bi(circle(-26, -26, 26)), ...[-90, -45, 180, 135].map(deg => bi(line(...at(-26, -26, 38, deg), ...at(-26, -26, 52, deg)))), move(scale(P(-40, 50).A(-40, 22, 28, 90, 270, 90).A(4, -10, 40, 200, 340, 90).A(42, 20, 30, 300, 450, 90).close(), 0.72), 18, 18)],

    // Places and travel
    ['map', 'directions travel location', polygon([[-68, -50], [-24, -66], [24, -50], [68, -66], [68, 50], [24, 66], [-24, 50], [-68, 66]]), bi(line(-24, -66, -24, 50)), bi(line(24, -50, 24, 66))],
    ['location-arrow', 'navigation direction gps', polygon([[-60, -4], [62, -62], [4, 60], [-6, 6]], 6)],
    ['car', 'vehicle drive automobile transport', P(-70, 30).L(-70, 4).Q(-70, -8, -56, -10).L(-44, -44).Q(-40, -50, -30, -50).L(30, -50).Q(40, -50, 44, -44).L(56, -10).Q(70, -8, 70, 4).L(70, 30).close(), wheel(-40, 34), wheel(40, 34), bi(line(-56, -10, 56, -10))],
    ['truck', 'delivery shipping transport', rect(-70, -50, 18, 32, 8), polygon([[18, -24, 6], [50, -24, 6], [70, 4, 4], [70, 32, 4], [18, 32, 0]]), wheel(-40, 40), wheel(42, 40)],
    ['bicycle', 'bike cycle ride', arc(-42, 26, 28, -90, 270), arc(42, 26, 28, -90, 270), bi(polyline([[-42, 26], [-14, -18], [24, -18], [42, 26]])), bi(polyline([[-14, -18], [4, 26], [24, -18]])), line(-24, -34, -4, -34)],
    ['bus', 'transit public transport', rect(-56, -68, 56, 52, 14), bi(line(-56, -6, 56, -6)), bi(dot(-32, 22)), bi(dot(32, 22)), line(-40, 52, -40, 68), line(40, 52, 40, 68)],
    // Wings and tail fins attach to the sides of the body, so the outline has no lines crossing it.
    ['plane', 'flight travel airplane trip', rect(-10, -70, 10, 66, 10), polygon([[-10, -18], [-70, 18], [-70, 32], [-10, 12]]), polygon([[10, -18], [70, 18], [70, 32], [10, 12]]), polygon([[-10, 46], [-32, 60], [-32, 68], [-10, 62]]), polygon([[10, 46], [32, 60], [32, 68], [10, 62]])],
    ['rocket', 'launch startup space fast', P(0, -70).Q(36, -46, 36, 16).L(36, 40).L(-36, 40).L(-36, 16).Q(-36, -46, 0, -70), polyline([[-36, 10], [-60, 32], [-60, 58], [-36, 40]]), polyline([[36, 10], [60, 32], [60, 58], [36, 40]]), bi(circle(0, -16, 14)), tri(line(0, 52, 0, 70))],
    ['anchor', 'ship marine harbor', bi(circle(0, -52, 14)), line(0, -38, 0, 66), bi(line(-28, -14, 28, -14)), arc(0, 6, 60, 10, 170), head(-60, 16, 190, 22), head(60, 16, -10, 22)],
    ['building', 'office company business city', rect(-48, -68, 48, 68, 8), ...[[-20, -40], [20, -40], [-20, -12], [20, -12], [-20, 16], [20, 16]].map(([x, y]) => bi(dot(x, y, 4))), bi(line(0, 44, 0, 68))],
    ['store', 'shop market retail', polygon([[-66, -62, 6], [66, -62, 6], [72, -24, 0], [-72, -24, 0]]), polyline([[-58, -24], [-58, 64], [58, 64], [58, -24]], 8), bi(polyline([[-20, 64], [-20, 22], [20, 22], [20, 64]], 6))],
    ['landmark', 'bank government museum institution', polygon([[0, -70], [70, -34], [-70, -34]], 6), ...[-44, -14, 14, 44].map(x => bi(line(x, -16, x, 44))), line(-70, 62, 70, 62)],
    ['graduation-cap', 'education school learn degree', polygon([[0, -54], [74, -20], [0, 14], [-74, -20]], 4), P(-42, -2).L(-42, 32).Q(0, 58, 42, 32).L(42, -2).end(), bi(line(64, -16, 64, 34))],
    ['hospital', 'medical health care first aid', rect(-64, -54, 64, 64, 12), bi(line(0, -24, 0, 34)), bi(line(-29, 5, 29, 5)), polyline([[-24, -54], [-24, -70], [24, -70], [24, -54]], 6)],
    ['utensils', 'restaurant food dining eat', line(-36, -68, -36, 68), polyline([[-56, -68], [-56, -34], [-16, -34], [-16, -68]], 10), P(36, 68).L(36, -68).Q(64, -50, 60, 0).L(36, 0).end()],
    ['mug-hot', 'coffee tea drink cafe', polygon([[-58, -22, 4], [34, -22, 4], [28, 60, 12], [-52, 60, 12]]), arc(36, 12, 22, -80, 90), bi(line(-34, -40, -34, -66)), bi(line(-12, -40, -12, -66)), bi(line(10, -40, 10, -66))],
    ['briefcase', 'work job business portfolio', rect(-70, -36, 70, 60, 12), polyline([[-24, -36], [-24, -60], [24, -60], [24, -36]], 8), bi(line(-70, 6, 70, 6))],

    // Commerce
    ['bag-shopping', 'shopping cart buy store', polygon([[-56, -34, 6], [56, -34, 6], [64, 64, 10], [-64, 64, 10]]), arc(0, -34, 26, 180, 360), bi(arc(0, -12, 22, 0, 180))],
    ['wallet', 'money payment cash', rect(-68, -50, 62, 56, 12), bi(rect(16, -8, 70, 24, 8)), bi(dot(36, 8, 3))],
    // A stack of coins seen from the side: the top face, then two edges below it.
    ['coins', 'money cash currency savings', ellipse(0, -38, 56, 20), P(-56, -38).L(-56, -14).Q(-56, 6, 0, 6).Q(56, 6, 56, -14).L(56, -38).end(), bi(P(-56, -14).L(-56, 10).Q(-56, 30, 0, 30).Q(56, 30, 56, 10).L(56, -14).end()), tri(P(-56, 10).L(-56, 34).Q(-56, 54, 0, 54).Q(56, 54, 56, 34).L(56, 10).end())],
    ['calculator', 'math accounting numbers', rect(-50, -68, 50, 68, 12), bi(rect(-30, -48, 30, -18, 4)), ...[[-26, 8], [0, 8], [26, 8], [-26, 32], [0, 32], [26, 32], [-26, 54], [0, 54]].map(([x, y]) => bi(dot(x, y, 3)))],
    ['ticket', 'event admission pass coupon', P(-70, -44).L(70, -44).L(70, -14).A(70, 0, 14, -90, -270, 90).L(70, 44).L(-70, 44).L(-70, 14).A(-70, 0, 14, 90, -90, 90).close(), bi(line(-20, -30, -20, 30))],
    ['medal', 'award winner prize badge', circle(0, 24, 38), polyline([[-24, -6], [-44, -68], [-14, -68], [2, -16]]), polyline([[24, -6], [44, -68], [14, -68], [-2, -16]]), bi(sparkle(0, 24, 18, 7))],
    ['crown', 'king premium vip royal', polygon([[-64, 44], [-70, -40], [-30, -4], [0, -62], [30, -4], [70, -40], [64, 44]]), bi(line(-64, 62, 64, 62))],
    ['gem', 'diamond jewel premium value', polygon([[-30, -50], [30, -50], [66, -14], [0, 62], [-66, -14]]), bi(line(-66, -14, 66, -14)), bi(polyline([[-30, -50], [-14, -14], [0, 62], [14, -14], [30, -50]]))],
    ['money-bill', 'cash payment dollar bill', rect(-72, -42, 72, 42, 10), bi(circle(0, 0, 20)), bi(dot(-48, 0, 3)), bi(dot(48, 0, 3))],
    ['heart-pulse', 'health heartbeat medical cardio', heartShape(), bi(polyline([[-62, 0], [-30, 0], [-16, -26], [6, 26], [20, 0], [62, 0]]))],
    ['heartbeat', 'pulse activity health monitor', polyline([[-70, 4], [-40, 4], [-22, -44], [8, 48], [26, 4], [70, 4]])],

    // Brands
    ['youtube', 'video brand social', rect(-72, -50, 72, 50, 24), bi(polygon([[-18, -26], [30, 0], [-18, 26]], 6))],
    ['linkedin', 'brand social professional', rect(-66, -66, 66, 66, 14), bi(line(-34, -8, -34, 40)), bi(dot(-34, -32, 3)), bi(P(-8, 40).L(-8, -8).end()), bi(P(-8, 10).Q(-8, -10, 14, -10).Q(36, -10, 36, 12).L(36, 40).end())],
    ['x-twitter', 'brand social x twitter', polygon([[-60, -62, 4], [-22, -62, 4], [60, 62, 4], [22, 62, 4]]), line(56, -62, -56, 62)],
    ['github', 'brand code git repository', ring(), bi(P(-22, 62).L(-22, 40).Q(-50, 36, -50, 6).Q(-50, -10, -40, -20).L(-42, -46).L(-20, -36).Q(0, -42, 20, -36).L(42, -46).L(40, -20).Q(50, -10, 50, 6).Q(50, 36, 22, 40).L(22, 62).end())],

    // Other names for existing icons, so people find what they expect.
    ['settings', 'gear options configure', circle(0, 0, 46), ...[0, 45, 90, 135, 180, 225, 270, 315].map(deg => ['20', line(...at(0, 0, 52, deg), ...at(0, 0, 61, deg))]), bi(circle(0, 0, 18))],
    ['menu', 'hamburger navigation bars', line(-60, -44, 60, -44), line(-60, 0, 60, 0), line(-60, 44, 60, 44)],
    ['close', 'xmark cancel times', line(-50, -50, 50, 50), line(-50, 50, 50, -50)],
    ['house', 'home main start', polygon([[-56, -6], [0, -64], [56, -6], [56, 62], [-56, 62]], 10), bi(polyline([[-16, 62], [-16, 20], [16, 20], [16, 62]], 6))],
    ['edit', 'pencil write modify', polyline([[-6, -60], [-60, -60], [-60, 60], [60, 60], [60, 6]], 12), polygon([[-14, 44, 0], [-8, 16, 4], [44, -36, 8], [64, -16, 8], [12, 36, 4]]), bi(line(30, -22, 50, -2))],
];
