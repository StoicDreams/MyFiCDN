// Icons for office tools, developer tools, social media, and game documentation. Same style and format as
// icons.mjs. Variations, such as a slash or a circle around an icon, come from webui-icon flags, not new icons.

import { P, line, polyline, polygon, rect, circle, ellipse, dot, arc, move, rotate, scale, mirror } from './lib.mjs';
import { at, head, bi, tri, ring, smooth, sparkle } from './parts.mjs';

const rotated = (deg, ...paths) => paths.map(p => (Array.isArray(p) ? [p[0], rotate(p[1], deg)] : rotate(p, deg)));
// An upright sword, point at the top, centered on the origin.
const sword = () => [polygon([[0, -72], [10, -58], [10, 30], [-10, 30], [-10, -58]]), bi(line(-30, 30, 30, 30)), bi(line(0, 30, 0, 58)), bi(dot(0, 66, 3))];
const phoneShape = () => P(-56, -64).L(-32, -68).L(-16, -34).L(-34, -18).Q(-18, 18, 18, 34).L(34, 16).L(68, 32).L(64, 56).Q(60, 70, 40, 68).Q(-64, 48, -68, -40).Q(-70, -60, -56, -64);
const plane = () => polygon([[-66, -8], [66, -62], [22, 64], [4, 8]], 8);
// A small 270 degree loop drawn as a line, in 90 degree curves so it fits in one path.
const loop = (cx, cy, a0, a1) => P(...at(cx, cy, 16, a0)).A(cx, cy, 16, a0, a1, 90).end();
const tagShape = () => polygon([[-66, -66, 10], [-6, -66, 6], [66, 6, 10], [6, 66, 10], [-66, -6, 6]]);

export const SETS = [
    // Office tools
    ['presentation-screen', 'slides projector meeting', rect(-68, -62, 68, 28, 8), polyline([[-32, 68], [0, 30], [32, 68]]), bi(polyline([[-42, 8], [-16, -18], [6, 0], [40, -34]]))],
    ['signature', 'sign contract agreement', smooth([[-66, 26], [-46, -40], [-26, 30], [-6, -24], [12, 26], [34, -6], [64, 10]], false), bi(line(-62, 54, 62, 54))],
    ['stamp', 'approve seal official', circle(0, -46, 22), line(-12, -26, -12, 22), line(12, -26, 12, 22), rect(-62, 22, 62, 46, 6), bi(line(-48, 64, 48, 64))],
    ['folder-tree', 'directory structure explorer', rect(-66, -68, -26, -40, 6), bi(polyline([[-46, -40], [-46, 52], [-14, 52]])), bi(line(-46, -4, -14, -4)), rect(-14, -18, 66, 10, 6), rect(-14, 38, 66, 66, 6)],
    ['envelope-open', 'mail read opened email', polygon([[-68, -14], [0, -64], [68, -14], [68, 62], [-68, 62]], 10), bi(polyline([[-68, -14], [0, 30], [68, -14]]))],
    ['list-ol', 'numbered ordered list', ['bi|7', polyline([[-64, -50], [-56, -58], [-56, -28]])], ['bi|7', P(-64, -6).Q(-64, -16, -55, -16).Q(-46, -16, -46, -6).L(-64, 16).L(-46, 16).end()],
        ['bi|7', P(-64, 30).L(-46, 30).L(-56, 42).Q(-46, 42, -46, 50).Q(-46, 60, -56, 60).Q(-62, 60, -64, 56).end()], line(-24, -44, 62, -44), line(-24, 0, 62, 0), line(-24, 46, 62, 46)],
    ['indent', 'text increase paragraph', line(-66, -56, 62, -56), line(-14, -18, 62, -18), line(-14, 18, 62, 18), line(-66, 56, 62, 56), bi(polygon([[-66, -20], [-36, 0], [-66, 20]], 4))],
    ['outdent', 'text decrease paragraph', line(-66, -56, 62, -56), line(-14, -18, 62, -18), line(-14, 18, 62, 18), line(-66, 56, 62, 56), bi(polygon([[-36, -20], [-66, 0], [-36, 20]], 4))],
    ['paragraph', 'pilcrow text formatting', P(10, -60).L(-16, -60).Q(-50, -60, -50, -30).Q(-50, 0, -16, 0).L(10, 0), line(10, -60, 10, 64), line(36, -60, 36, 64), line(10, -60, 50, -60)],
    ['quote', 'quotation citation testimonial', rect(-64, -4, -20, 38, 10), P(-64, 6).Q(-64, -40, -24, -52).end(), rect(12, -4, 56, 38, 10), P(12, 6).Q(12, -40, 52, -52).end()],
    ['heading', 'title header text h', line(-44, -60, -44, 60), line(44, -60, 44, 60), bi(line(-44, 0, 44, 0))],
    ['highlighter', 'marker emphasize text', ...rotated(40, rect(-16, -70, 16, 8, 6), polygon([[-16, 8], [16, 8], [6, 32], [-6, 32]], 2)), bi(line(-66, 64, 14, 64))],
    ['ruler', 'measure length size', rotate(rect(-70, -22, 70, 22, 6), -45), ...[-40, -14, 12, 38].map((x, i) => bi(rotate(line(x, -22, x, i % 2 ? -10 : 0), -45)))],
    ['kanban', 'board columns tasks agile', rect(-66, -62, -30, 34, 8), rect(-18, -62, 18, 62, 8), rect(30, -62, 66, 8, 8)],
    ['chart-area', 'graph statistics analytics', polyline([[-68, -68], [-68, 64], [68, 64]], 10), bi(polygon([[-48, 48], [-48, 10], [-20, -20], [10, 4], [52, -38], [52, 48]]))],
    ['chart-gantt', 'timeline schedule project plan', polyline([[-68, -68], [-68, 64], [68, 64]], 10), bi(line(-46, -38, 0, -38)), bi(line(-22, -8, 30, -8)), bi(line(10, 24, 56, 24))],
    ['tags', 'labels categories', move(scale(tagShape(), 0.84), -8, 6), bi(polyline([[-46, -70], [6, -70], [72, -4]], 8)), bi(dot(-36, -24, 2))],
    ['scale-balanced', 'justice legal law compare fair', line(0, -62, 0, 62), line(-56, -44, 56, -44), line(-30, 64, 30, 64),
        polyline([[-74, 10], [-56, -44], [-38, 10]]), bi(arc(-56, 10, 18, 0, 180)), polyline([[38, 10], [56, -44], [74, 10]]), bi(arc(56, 10, 18, 0, 180))],
    ['id-badge', 'employee name tag lanyard', rect(-48, -62, 48, 68, 10), bi(circle(0, -6, 16)), bi(P(-30, 46).Q(-30, 20, 0, 20).Q(30, 20, 30, 46).end()), bi(line(-14, -44, 14, -44))],
    ['voicemail', 'message recording phone', circle(-38, 0, 24), circle(38, 0, 24), bi(line(-38, 24, 38, 24))],
    ['paste', 'clipboard insert', rect(-58, -54, 34, 66, 12), bi(rect(-30, -70, 6, -42, 6)), bi(rect(-4, -14, 64, 60, 8))],
    ['list-tree', 'hierarchy outline nested', line(-62, -50, 62, -50), bi(polyline([[-50, -38], [-50, 2], [-24, 2]])), line(-6, 2, 62, 2), bi(polyline([[-50, 2], [-50, 50], [-24, 50]])), line(-6, 50, 62, 50)],

    // Developer tools
    ['code-pull-request', 'git pr review merge', circle(-40, -50, 13), circle(-40, 50, 13), line(-40, -36, -40, 36), circle(40, 50, 13), P(40, 36).L(40, -18).Q(40, -40, 18, -40).L(-4, -40).end(), bi(head(-6, -40, 180, 20))],
    ['code-fork', 'git branch repository copy', circle(-40, -52, 13), circle(40, -52, 13), circle(0, 52, 13), P(-40, -38).L(-40, -20).Q(-40, 0, -20, 0).L(20, 0).Q(40, 0, 40, -20).L(40, -38).end(), bi(line(0, 0, 0, 38))],
    ['brackets-square', 'array code list', polyline([[-26, -64], [-54, -64], [-54, 64], [-26, 64]]), polyline([[26, -64], [54, -64], [54, 64], [26, 64]])],
    ['wrench', 'settings tool fix repair', rotate(P(-12, -24).L(-12, 60).Q(-12, 72, 0, 72).Q(12, 72, 12, 60).L(12, -24).Q(38, -36, 36, -62).L(14, -48).L(-14, -48).L(-36, -62).Q(-38, -36, -12, -24), 45)],
    ['hammer', 'build tool construct', ...rotated(-45, bi(rect(-8, -20, 8, 70, 6)), polygon([[-44, -58], [34, -58], [46, -40], [34, -20], [-44, -20]], 6))],
    ['toolbox', 'tools kit repair', rect(-70, -24, 70, 60, 10), polyline([[-28, -24], [-28, -50], [28, -50], [28, -24]], 8), bi(line(-70, 10, 70, 10)), bi(rect(-14, 2, 14, 18, 4))],
    ['nodes', 'graph network connections diagram', circle(0, -50, 16), circle(-50, 40, 16), circle(50, 40, 16), bi(line(-8, -36, -42, 26)), bi(line(8, -36, 42, 26)), bi(line(-34, 40, 34, 40))],
    ['hard-drive', 'disk storage hdd', rect(-68, -40, 68, 40, 12), bi(line(-46, 18, 20, 18)), bi(dot(44, 18, 3))],
    ['memory', 'ram hardware chip', rect(-70, -30, 70, 26, 6), ...[-48, -24, 0, 24, 48].map(x => line(x, 26, x, 44)), bi(rect(-50, -14, -14, 10, 2)), bi(rect(14, -14, 50, 10, 2))],
    ['asterisk', 'required star wildcard', ...[0, 60, 120].map(deg => rotate(line(0, -62, 0, 62), deg))],
    ['regex', 'regular expression pattern search', dot(-46, 52, 4), ...[0, 60, 120].map(deg => bi(move(rotate(line(0, -34, 0, 34), deg), 24, -20)))],
    ['function', 'math formula code fx', P(42, -58).Q(32, -68, 16, -66).Q(-6, -64, -8, -40).L(-22, 54).Q(-26, 72, -48, 66).end(), bi(line(-34, -22, 28, -22))],
    ['i-cursor', 'text cursor input caret', P(-26, -66).Q(0, -66, 0, -50).Q(0, -66, 26, -66).end(), P(-26, 66).Q(0, 66, 0, 50).Q(0, 66, 26, 66).end(), line(0, -50, 0, 50)],
    ['command', 'mac key shortcut keyboard', loop(-36, -36, 0, -270), loop(36, -36, 180, 450), loop(-36, 36, 0, 270), loop(36, 36, 180, -90),
        line(-20, -36, -20, 36), line(20, -36, 20, 36), line(-36, -20, 36, -20), line(-36, 20, 36, 20)],
    ['delete-left', 'backspace erase key remove', polygon([[-36, -46, 0], [66, -46, 10], [66, 46, 10], [-36, 46, 0], [-72, 0, 0]]), bi(line(-4, -16, 28, 16)), bi(line(-4, 16, 28, -16))],
    ['robot', 'bot ai automation assistant', rect(-56, -36, 56, 52, 14), line(0, -36, 0, -58), dot(0, -64, 4), bi(dot(-24, 0, 5)), bi(dot(24, 0, 5)), bi(line(-20, 28, 20, 28)), line(-56, 4, -70, 4), line(56, 4, 70, 4)],
    ['puzzle-piece', 'plugin extension addon game', P(-52, -36).L(-16, -36).Q(-28, -70, 0, -70).Q(28, -70, 16, -36).L(52, -36).L(52, 0).Q(76, -12, 76, 16).Q(76, 44, 52, 32).L(52, 64).L(-52, 64).close()],
    ['atom', 'science react physics', ellipse(0, 0, 70, 26), rotate(ellipse(0, 0, 70, 26), 60), rotate(ellipse(0, 0, 70, 26), 120), bi(dot(0, 0, 4))],
    ['broadcast', 'live stream radio signal tower', circle(0, -14, 10), polyline([[-24, 64], [0, -2], [24, 64]]), bi(arc(0, -14, 34, 140, 220)), bi(arc(0, -14, 34, -40, 40)), tri(arc(0, -14, 58, 140, 220)), tri(arc(0, -14, 58, -40, 40))],
    ['bars-progress', 'progress loading status', rect(-66, -50, 66, -18, 8), rect(-66, 18, 66, 50, 8), bi(line(-50, -34, 22, -34)), bi(line(-50, 34, -12, 34))],
    ['virus', 'bug malware infection germ', circle(0, 0, 36), ...[0, 45, 90, 135, 180, 225, 270, 315].map(deg => line(...at(0, 0, 44, deg), ...at(0, 0, 62, deg))), bi(dot(-10, -8, 4))],
    ['git', 'version control brand', rotate(rect(-50, -50, 50, 50, 12), 45), bi(circle(-14, 22, 10)), bi(circle(18, -10, 10)), bi(line(-14, -36, -14, 12)), bi(line(-14, -14, 8, -10))],
    ['stack-overflow', 'questions answers developer brand', polyline([[-56, 10], [-56, 64], [56, 64], [56, 10]]), bi(line(-36, 42, 32, 42)), bi(rotate(line(-36, 18, 30, 18), 10)), bi(rotate(line(-30, -8, 34, -8), 22)), bi(rotate(line(-20, -36, 40, -36), 36))],

    // Social media
    ['reddit', 'brand social forum', ellipse(0, 18, 62, 40), circle(-58, -10, 12), circle(58, -10, 12), polyline([[0, -22], [10, -60], [32, -54]]), circle(42, -58, 10), bi(dot(-24, 10, 4)), bi(dot(24, 10, 4)), bi(arc(0, 22, 26, 30, 150))],
    ['twitch', 'brand streaming live', polygon([[-56, -66], [62, -66], [62, 22], [28, 56], [4, 56], [-20, 72], [-20, 56], [-56, 56]]), bi(line(4, -36, 4, 0)), bi(line(32, -36, 32, 0))],
    ['tiktok', 'brand video social', arc(-16, 26, 28, 0, 360), line(12, 26, 12, -66), P(12, -66).Q(18, -36, 50, -32).end()],
    ['pinterest', 'brand social pins', ring(), bi(P(-12, -38).Q(32, -46, 34, -12).Q(34, 22, -2, 20).end()), bi(line(-8, -36, -26, 64))],
    ['whatsapp', 'brand chat message phone', P(-62, 64).L(...at(4, -6, 58, 150)).A(4, -6, 58, 150, 480, 90).close(), bi(move(scale(phoneShape(), 0.42), 4, -6))],
    ['telegram', 'brand chat message', ring(), bi(move(scale(plane(), 0.6), -4, 4))],
    ['mastodon', 'brand social fediverse', P(-58, -38).Q(-58, -64, -30, -64).L(30, -64).Q(58, -64, 58, -38).L(58, 16).Q(58, 42, 30, 42).L(-20, 42).Q(-20, 62, 20, 60).Q(-58, 72, -58, 30).close(),
        bi(P(-30, 18).L(-30, -14).Q(-30, -32, -15, -32).Q(0, -32, 0, -14).L(0, 6).end()), bi(P(0, -14).Q(0, -32, 15, -32).Q(30, -32, 30, -14).L(30, 18).end())],
    ['bluesky', 'brand social butterfly', smooth([[0, -4], [-28, -50], [-70, -60], [-66, -10], [-30, 4], [-56, 30], [-36, 62], [-6, 30]]), mirror(smooth([[0, -4], [-28, -50], [-70, -60], [-66, -10], [-30, 4], [-56, 30], [-36, 62], [-6, 30]]))],
    ['snapchat', 'brand social ghost', smooth([[0, -66], [44, -58], [44, -6], [64, 32], [22, 44], [0, 62], [-22, 44], [-64, 32], [-44, -6], [-44, -58]])],
    ['spotify', 'brand music streaming', ring(), bi(P(-44, -18).Q(0, -34, 46, -10).end()), bi(P(-38, 6).Q(0, -6, 40, 14).end()), bi(P(-30, 30).Q(0, 22, 32, 36).end())],
    ['patreon', 'brand creator support', circle(14, -12, 42), bi(rect(-64, -54, -42, 64, 4))],
    ['steam', 'brand game store', ring(), bi(circle(24, -16, 20)), bi(circle(-30, 28, 14)), bi(line(-18, 20, 8, 0))],
    ['face-laugh', 'happy joy emoji lol', ring(), bi(arc(-24, -14, 10, 200, 340)), bi(arc(24, -14, 10, 200, 340)), bi(P(-34, 12).L(34, 12).Q(30, 44, 0, 44).Q(-30, 44, -34, 12))],
    ['face-surprise', 'wow shock emoji', ring(), bi(dot(-24, -18)), bi(dot(24, -18)), bi(circle(0, 26, 14))],
    ['podcast', 'audio show episode', circle(0, -14, 16), bi(arc(0, -14, 40, 135, 405)), tri(arc(0, -14, 64, 140, 400)), line(0, 2, 0, 66)],

    // Game documentation
    ['dice', 'game random roll d6 board', rect(-60, -60, 60, 60, 16), ...[[-30, -30], [30, -30], [0, 0], [-30, 30], [30, 30]].map(([x, y]) => bi(dot(x, y, 5)))],
    ['dice-d20', 'game rpg roll tabletop', polygon([[0, -70], [61, -35], [61, 35], [0, 70], [-61, 35], [-61, -35]]), bi(polygon([[0, -30], [36, 26], [-36, 26]])),
        bi(line(0, -70, 0, -30)), bi(line(61, 35, 36, 26)), bi(line(-61, 35, -36, 26)), bi(line(0, 70, 36, 26)), bi(line(0, 70, -36, 26))],
    ['sword', 'weapon attack combat fight', ...rotated(45, ...sword())],
    ['swords', 'battle combat crossed weapons', ...rotated(45, ...sword().map(p => (Array.isArray(p) ? [p[0], scale(p[1], 0.92)] : scale(p, 0.92)))), ...rotated(-45, ...sword().map(p => bi(scale(Array.isArray(p) ? p[1] : p, 0.92))))],
    ['axe', 'weapon chop wood tool', ...rotated(30, bi(line(0, -66, 0, 70)), P(0, -58).L(30, -66).Q(66, -46, 62, -6).Q(56, 22, 30, 16).L(0, 4).close())],
    ['bow-arrow', 'archery weapon ranged', P(20, -66).Q(-70, 0, 20, 66).end(), bi(line(20, -66, 20, 66)), line(-60, 0, 64, 0), head(66, 0, 0, 22)],
    ['bomb', 'explosive attack danger', circle(-8, 14, 50), P(26, -22).Q(40, -46, 56, -46).end(), bi(sparkle(62, -58, 14))],
    ['potion', 'flask elixir magic health mana', P(-14, -58).L(...at(0, 22, 46, 252.3)).A(0, 22, 46, 252.3, -72.3, 90).L(14, -58).close(), rect(-22, -70, 22, -58, 4), bi(P(-42, 22).Q(-20, 10, 0, 22).Q(20, 34, 42, 22).end())],
    ['scroll', 'quest parchment document lore', rect(-62, -68, 46, -42, 13), polyline([[-48, -42], [-48, 60], [52, 60], [52, -42]], 8), bi(line(-28, -16, 32, -16)), bi(line(-28, 12, 32, 12)), bi(line(-28, 38, 10, 38))],
    ['treasure-chest', 'loot reward inventory chest', rect(-68, -20, 68, 60, 8), P(-68, -20).L(-68, -34).Q(-68, -62, -40, -62).L(40, -62).Q(68, -62, 68, -34).L(68, -20).end(), bi(rect(-12, -30, 12, 0, 4))],
    ['skull', 'death danger poison dead', P(-34, 54).L(-34, 36).Q(-62, 26, -62, -10).Q(-62, -66, 0, -66).Q(62, -66, 62, -10).Q(62, 26, 34, 36).L(34, 54).close(),
        bi(circle(-24, -8, 12)), bi(circle(24, -8, 12)), bi(line(-12, 40, -12, 54)), bi(line(12, 40, 12, 54))],
    ['ghost', 'spirit halloween enemy', P(-50, 64).L(-50, -10).Q(-50, -66, 0, -66).Q(50, -66, 50, -10).L(50, 64).L(34, 50).L(18, 64).L(0, 50).L(-18, 64).L(-34, 50).close(), bi(dot(-20, -14, 4)), bi(dot(20, -14, 4))],
    ['helmet', 'armor knight defense', P(-50, 62).L(-50, -12).Q(-50, -66, 0, -66).Q(50, -66, 50, -12).L(50, 62).close(), bi(line(-50, -10, 50, -10)), bi(line(0, 6, 0, 50))],
    ['ring', 'jewelry accessory item', circle(0, 18, 46), bi(polygon([[0, -72], [24, -50], [0, -28], [-24, -50]]))],
    ['castle', 'fortress kingdom base', polygon([[-64, 64], [-64, -60], [-36, -60], [-36, -40], [36, -40], [36, -60], [64, -60], [64, 64]]), bi(rect(-10, -62, 10, -40, 0)), bi(P(-18, 64).L(-18, 30).A(0, 30, 18, 180, 360).L(18, 64).end())],
    ['chess-pawn', 'game strategy board piece', circle(0, -40, 20), polygon([[-16, -16], [16, -16], [30, 40], [-30, 40]], 4), bi(rect(-46, 40, 46, 62, 8))],
    ['tent', 'camp outdoors shelter', polygon([[0, -62], [70, 58], [-70, 58]], 6), bi(polyline([[-22, 58], [0, 10], [22, 58]]))],
    ['campfire', 'camp rest save point fire', line(-58, 62, 58, 34), line(-58, 34, 58, 62), bi(P(0, 30).Q(-34, 28, -34, 2).Q(-34, -18, -12, -36).Q(-8, -18, 0, -16).Q(4, -44, 16, -60).Q(36, -28, 34, 2).Q(34, 28, 0, 30))],
    ['backpack', 'inventory bag travel', rect(-50, -44, 50, 66, 18), polyline([[-22, -44], [-22, -64], [22, -64], [22, -44]], 8), bi(rect(-30, 14, 30, 48, 8))],
    ['dumbbell', 'strength fitness gym stat', bi(line(-40, 0, 40, 0)), rect(-58, -30, -40, 30, 6), rect(40, -30, 58, 30, 6), rect(-72, -18, -58, 18, 4), rect(58, -18, 72, 18, 4)],
    ['feather', 'light write quill speed', P(-62, 62).Q(-42, -40, 62, -64).Q(44, 36, -62, 62), bi(line(-70, 70, 30, -30))],
    ['bone', 'skeleton dog item', ...rotated(-45, rect(-42, -10, 42, 10, 0), circle(-48, -12, 13), circle(-48, 12, 13), circle(48, -12, 13), circle(48, 12, 13))],
    ['cards', 'playing card deck game', P(-24, -40).L(-56, -30).L(-36, 60).L(-24, 57).end(), rect(-24, -58, 56, 56, 10), bi(move(scale(P(0, 62).Q(-74, 8, -68, -28).Q(-62, -66, -26, -62).Q(-8, -60, 0, -42).Q(8, -60, 26, -62).Q(62, -66, 68, -28).Q(74, 8, 0, 62), 0.32), 16, 0))],
    ['flag-checkered', 'finish race goal complete', line(-56, -66, -56, 68), polygon([[-56, -62], [62, -62], [62, 2], [-56, 2]]), bi(rect(-56, -62, 3, -30, 0)), bi(rect(3, -30, 62, 2, 0))],
    ['joystick', 'arcade game controller', rect(-60, 30, 60, 62, 10), line(0, 30, 0, -22), circle(0, -44, 22), bi(dot(36, 46, 3))],
    ['door-open', 'exit enter room leave', polyline([[-40, 64], [-40, -64], [40, -64], [40, 64]]), polygon([[-40, -64], [16, -54], [16, 70], [-40, 64]]), bi(dot(4, 4, 3)), line(-62, 64, 62, 64)],
    ['apple', 'food fruit health item', smooth([[0, -30], [44, -48], [64, 0], [36, 64], [0, 50], [-36, 64], [-64, 0], [-44, -48]]), line(0, -30, 6, -64), bi(P(6, -48).Q(22, -70, 40, -60).Q(28, -40, 6, -48))],
    ['podium', 'ranking leaderboard winner competition', polygon([[-66, 62], [-66, 0], [-22, 0], [-22, -34], [22, -34], [22, -14], [66, -14], [66, 62]]), bi(sparkle(0, -58, 14))],
    ['level-up', 'upgrade rank promote experience', line(0, 44, 0, -50), head(0, -52, -90, 36), bi(line(-50, 64, 50, 64))],
    // Icons for the inside of shape:file, which replaces separate file icons, as in diff|shape:file|bordered.
    ['diff', 'compare changes patch plus minus', line(0, -66, 0, -6), line(-30, -36, 30, -36), bi(line(-30, 44, 30, 44))],
    ['zipper', 'archive zip compressed', line(0, -70, 0, -4), ...[-62, -38, -14].map(y => bi(line(-26, y, 0, y))), ...[-50, -26].map(y => bi(line(0, y, 26, y))), rect(-28, 8, 28, 68, 10), bi(line(0, 24, 0, 48))],
    ['rain', 'weather drops storm shower', ...[[-40, -60], [6, -60], [52, -60], [-17, 12], [29, 12]].map(([x, y]) => line(x, y, x - 16, y + 46))],
];
