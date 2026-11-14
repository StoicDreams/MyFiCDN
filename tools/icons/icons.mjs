// Web UI icon designs. Run `npm run icons` to write them to cdn/icons.
//
// Each path has 11 curves (see lib.mjs).
// Style: a 10 unit round stroke, drawn inside a live area of -75 to 75 so icons fit inside every backing shape.
// Containers are 128 units wide with 12 unit corners, and circles have a radius of 70. Each icon's outline is
// one closed shape where possible, so it fills cleanly. Details inside it use the "bi" shade, and accents
// the "tri" shade, so they still show when the icon is filled.
//
// Each icon is [name, tags, ...paths]. A path is a Path, or [shade, Path] where shade is "bi" or "tri".

import { P, line, polyline, polygon, rect, circle, ellipse, dot, arc, move, rotate, scale, mirror } from './lib.mjs';
import {
    at, head, curvedArrow, shadedArrow, bi, tri, box, ring, lens, lensHandle, personHead, shoulders, bubble, docShape, docFold,
    shieldShape, trayLine, play, eyeShape, speaker, crescent, ray, tilted, cloudOutline,
} from './parts.mjs';

export const ICONS = [
    // Basic shapes
    ['circle', 'shape round dot', ring(72)],
    ['square', 'shape box', box(14)],
    ['diamond', 'shape rhombus', polygon([[0, -76], [76, 0], [0, 76], [-76, 0]], 10)],
    ['triangle', 'shape', polygon([[0, -68], [74, 60], [-74, 60]], 12)],

    // Marks
    ['plus', 'add new create', line(0, -62, 0, 62), line(-62, 0, 62, 0)],
    ['minus', 'subtract remove less', line(-62, 0, 62, 0)],
    ['xmark', 'close cancel delete remove times reject deny decline fail failed failure error clear', line(-50, -50, 50, 50), line(-50, 50, 50, -50)],
    ['check', 'confirm done yes ok tick success complete completed verify', polyline([[-58, 4], [-20, 42], [58, -40]])],
    ['equals', 'equal same', line(-56, -22, 56, -22), line(-56, 22, 56, 22)],
    ['exclamation', 'alert warning important attention urgent error', line(0, -66, 0, 24), bi(dot(0, 58))],
    ['question', 'help unknown faq', P(-40, -26).A(0, -26, 40, 180, 360).Q(40, -2, 14, 8).Q(0, 14, 0, 28).end(), bi(dot(0, 60))],
    ['info', 'information about details', line(0, -18, 0, 62), bi(dot(0, -52))],

    // Arrows and chevrons. Turn them with the rotate and flip attributes for other directions.
    ['arrow', 'pointer direction right next forward previous back continue go', bi(line(-62, 0, 60, 0)), head(62, 0, 0, 44)],
    ['chevron', 'angle right next forward previous back continue', polyline([[-22, -50], [28, 0], [-22, 50]])],
    ['caret', 'triangle direction up expand collapse upvote downvote vote', polygon([[0, -28], [56, 28], [-56, 28]], 10)],
    ['caret-line', 'triangle direction first top', bi(line(-56, -48, 56, -48)), polygon([[0, -16], [56, 40], [-56, 40]], 10)],
    ['arrow-corner-from-square', 'external link open new window',
        polyline([[-8, -60], [-60, -60], [-60, 60], [60, 60], [60, 8]], 12), line(-6, 6, 62, -62), bi(polyline([[22, -62], [62, -62], [62, -22]]))],
    ['arrow-corner-into-square', 'internal minimize collapse',
        polyline([[-8, -60], [-60, -60], [-60, 60], [60, 60], [60, 8]], 12), line(62, -62, -2, 2), bi(polyline([[-2, -38], [-2, 2], [38, 2]]))],
    ['arrow-side-from-square', 'external sign out log exit leave logout signout export',
        polyline([[12, -62], [-62, -62], [-62, 62], [12, 62]], 12), line(-18, 0, 66, 0), bi(head(66, 0, 0, 34))],
    ['arrow-side-into-square', 'internal sign in log enter login signin import',
        polyline([[12, -62], [-62, -62], [-62, 62], [12, 62]], 12), line(66, 0, -18, 0), bi(head(-18, 0, 180, 34))],
    ['download', 'save get install import', line(0, -68, 0, 24), head(0, 24, 90, 40), bi(trayLine())],
    ['upload', 'send put publish', line(0, 22, 0, -66), head(0, -66, -90, 40), bi(trayLine())],
    ['refresh', 'reload sync update rotate retry again reset', ...shadedArrow(0, 0, 58, 200, 330), ...shadedArrow(0, 0, 58, 20, 150)],
    ['undo', 'back revert rotate left redo restore', ...shadedArrow(0, 4, 56, 420, 200)],
    ['share', 'send network social', circle(46, -46, 18), circle(-46, 0, 18), circle(46, 46, 18), bi(line(-28, -8, 30, -38)), bi(line(-28, 8, 30, 38))],
    ['expand', 'maximize fullscreen enlarge', polyline([[-64, -22], [-64, -64], [-22, -64]]), bi(polyline([[22, -64], [64, -64], [64, -22]])), polyline([[64, 22], [64, 64], [22, 64]]), bi(polyline([[-22, 64], [-64, 64], [-64, 22]]))],
    ['compress', 'minimize exit fullscreen shrink', polyline([[-64, -22], [-22, -22], [-22, -64]]), bi(polyline([[22, -64], [22, -22], [64, -22]])), polyline([[64, 22], [22, 22], [22, 64]]), bi(polyline([[-22, 64], [-22, 22], [-64, 22]]))],
    ['sort', 'order arrange up down', bi(line(-30, 60, -30, -58)), head(-30, -60, -90, 30), bi(line(30, -60, 30, 58)), head(30, 60, 90, 30)],

    // Interface
    ['hamburger', 'menu navigation bars', line(-60, -44, 60, -44), line(-60, 0, 60, 0), line(-60, 44, 60, 44)],
    ['list', 'items bullets lines changelog release notes queue', bi(dot(-54, -44, 4)), bi(dot(-54, 0, 4)), bi(dot(-54, 44, 4)), line(-24, -44, 62, -44), line(-24, 0, 62, 0), line(-24, 44, 62, 44)],
    ['grid', 'tiles apps dashboard applications components widgets widget', rect(-64, -64, -10, -10, 10), bi(rect(10, -64, 64, -10, 10)), bi(rect(-64, 10, -10, 64, 10)), rect(10, 10, 64, 64, 10)],
    ['ellipsis', 'more options dots menu kebab vertical horizontal', circle(-48, 0, 6), bi(circle(0, 0, 6)), tri(circle(48, 0, 6))],
    ['sliders', 'settings adjust controls filter preferences', line(-62, -44, -32, -44), line(-4, -44, 62, -44), bi(circle(-18, -44, 13)),
        line(-62, 0, 14, 0), line(42, 0, 62, 0), bi(circle(28, 0, 13)), line(-62, 44, -16, 44), line(12, 44, 62, 44), bi(circle(-2, 44, 13))],
    // Teeth are short lines with a wide stroke, so they keep rounded, even corners and fill with the body.
    ['gear', 'settings options configure cog preferences admin administration service', circle(0, 0, 46), ...[0, 45, 90, 135, 180, 225, 270, 315].map(deg => ['20', line(...at(0, 0, 52, deg), ...at(0, 0, 61, deg))]), bi(circle(0, 0, 18))],
    ['search', 'find magnify look', lens(), bi(lensHandle())],
    ['magnifying-glass', 'search find', lens(), bi(lensHandle())],
    ['zoom-in', 'magnify enlarge', lens(), lensHandle(), bi(line(-14, -34, -14, 6)), bi(line(-34, -14, 6, -14))],
    ['zoom-out', 'shrink', lens(), lensHandle(), bi(line(-34, -14, 6, -14))],
    ['filter', 'funnel refine', polygon([[-66, -62, 8], [66, -62, 8], [14, 2, 0], [14, 50, 6], [-14, 64, 6], [-14, 2, 6]]), bi(line(-34, -40, 34, -40))],
    ['drawer', 'panel tray sidebar side layout columns', box(), bi(line(-64, 22, 64, 22))],
    ['layers', 'stack levels template templates themes', polygon([[0, -62], [70, -24], [0, 14], [-70, -24]], 8), bi(polyline([[-70, 6], [0, 44], [70, 6]])), tri(polyline([[-70, 34], [0, 72], [70, 34]]))],
    ['toggle-off', 'switch disabled inactive', rect(-74, -38, 74, 38, 38), bi(circle(-36, 0, 22))],
    ['toggle-on', 'switch enabled active', rect(-74, -38, 74, 38, 38), bi(circle(36, 0, 22))],
    ['gallery-thumbs', 'images photos carousel', rect(-64, -64, 64, 24, 12), ...[-64, -29, 6, 41].map(x => bi(rect(x, 44, x + 23, 64, 4)))],
    ['stacked-squares', 'layers copies collection template templates components shapes', rect(-24, -64, 64, 24, 12), bi(polyline([[-44, -44], [-44, 44], [44, 44]], 12)), tri(polyline([[-64, -24], [-64, 64], [24, 64]], 12))],
    ['hierarchy', 'organization tree structure sitemap', rect(-18, -66, 18, -32, 8), rect(-64, 28, -30, 62, 8), rect(-17, 28, 17, 62, 8), rect(30, 28, 64, 62, 8),
        bi(line(0, -32, 0, 28)), bi(polyline([[-47, 28], [-47, -2], [47, -2], [47, 28]], 8))],

    // People
    ['person', 'user account profile avatar member customer client guest character player hero', personHead(), bi(shoulders())],
    ['user', 'person account profile avatar member customer client guest character player hero author owner picture', personHead(), bi(shoulders())],
    ['users', 'people group team members member community friend friends followers following family customer customers client clients staff', personHead(-22, -30, 22), shoulders(-22, 12, 48, 62), bi(arc(36, -30, 20, -110, 120)), bi(P(46, 14).Q(70, 22, 70, 62).end())],

    // Security
    ['lock', 'secure password private privacy encryption encrypt locked', rect(-50, -6, 50, 64, 12), P(-32, -6).L(-32, -28).A(0, -28, 32, 180, 360).L(32, -6).end(), bi(line(0, 20, 0, 38))],
    ['unlock', 'open unsecure unlocked public', rect(-50, -6, 50, 64, 12), P(-32, -6).L(-32, -34).A(0, -34, 32, 180, 340).end(), bi(line(0, 20, 0, 38))],
    ['key', 'password access token credentials auth authentication login', circle(-34, -34, 30), line(-12, -12, 62, 62), bi(line(30, 30, 46, 14)), bi(line(46, 46, 60, 32))],
    ['shield', 'security protection safe privacy policy firewall permission permissions', shieldShape(), bi(line(0, -50, 0, 52))],
    ['eye', 'view visible show watch vision preview hide hidden', eyeShape(), bi(circle(0, 0, 22))],

    // Communication
    ['envelope', 'mail email message letter newsletter subscribe unsubscribe', rect(-68, -50, 68, 50, 10), bi(polyline([[-60, -40], [0, 8], [60, -40]]))],
    ['mail', 'envelope email message letter newsletter', rect(-68, -50, 68, 50, 10), bi(polyline([[-60, -40], [0, 8], [60, -40]]))],
    ['comment', 'message chat bubble speech sms text', bubble(), bi(P(-48, -18).L(-48, -26).Q(-48, -38, -36, -38).L(-24, -38).end())],
    ['feedback', 'message comment review', bubble(), bi(line(-40, -24, 40, -24)), bi(line(-40, 0, 20, 0))],
    ['messages', 'chat conversation comments community forum', polygon([[-66, -40, 10], [26, -40, 10], [26, 26, 10], [-24, 26, 0], [-50, 50, 0], [-48, 26, 0], [-66, 26, 10]]),
        bi(polyline([[-34, -54], [-34, -66], [66, -66], [66, 4], [44, 4]], 10)), bi(line(-46, -16, 6, -16)), bi(line(-46, 4, -6, 4))],
    ['messages-question', 'chat help support faq', bubble(), bi(P(-20, -24).A(0, -24, 20, 180, 360).Q(20, -10, 6, -4).Q(0, -1, 0, 6).end()), bi(dot(0, 20))],
    ['send', 'paper plane submit message publish sent', polygon([[-66, -8], [66, -62], [22, 64], [4, 8]], 8), bi(line(4, 8, 66, -62))],
    ['bell', 'notification alert alarm reminder notify', P(-62, 40).Q(-46, 28, -46, -6).Q(-46, -58, 0, -58).Q(46, -58, 46, -6).Q(46, 28, 62, 40).close(), line(0, -58, 0, -70), bi(arc(0, 50, 18, 0, 180))],
    ['mobile', 'phone smartphone cell device', rect(-38, -68, 38, 68, 12), bi(line(-10, 48, 10, 48))],
    ['phone', 'mobile smartphone call device', rect(-38, -68, 38, 68, 12), bi(line(-10, 48, 10, 48))],
    ['link', 'chain url hyperlink webhook webhooks unlink website', bi(tilted(-70, -22, 10, 22, 22, -45)), tilted(-10, -22, 70, 22, 22, -45)],
    // An upright clip, three loops long, tilted 45 degrees.
    ['paperclip', 'attachment attach', rotate(P(12, -26).L(12, 34).A(0, 34, 12, 0, 180, 90).L(-12, -44).A(6, -44, 18, 180, 360, 90).L(24, 44).A(0, 44, 24, 0, 180, 90).L(-24, -14).end(), 45)],
    ['globe', 'world internet web language translate earth country website', ring(), bi(ellipse(0, 0, 30, 70)), bi(line(-70, 0, 70, 0))],
    ['wifi', 'wireless internet signal network online offline connected', arc(0, 40, 92, 230, 310), arc(0, 40, 60, 228, 312), arc(0, 40, 28, 225, 315), bi(dot(0, 46, 4))],

    // Time and places
    ['calendar', 'date month days done confirmed add new schedule event today week appointment booking reservation', rect(-64, -50, 64, 64, 12), line(-30, -68, -30, -36), line(30, -68, 30, -36), bi(line(-64, -14, 64, -14))],
    ['clock', 'time hour schedule pending waiting deadline latest', ring(), bi(polyline([[0, -40], [0, 0], [30, 22]]))],
    ['home', 'house main start', polygon([[-56, -6], [0, -64], [56, -6], [56, 62], [-56, 62]], 10), bi(polyline([[-16, 62], [-16, 20], [16, 20], [16, 62]], 6))],
    ['location', 'map pin marker place exif gps metadata', P(0, 70).Q(-58, 12, -58, -16).A(0, -16, 58, 180, 360).Q(58, 12, 0, 70), bi(circle(0, -16, 20))],
    ['compass', 'direction navigate explore discover guide getting started', ring(), bi(polygon([[34, -34], [10, 10], [-34, 34], [-10, -10]], 4))],
    ['flag', 'report mark goal country', bi(line(-54, -66, -54, 68)), polygon([[-54, -62, 0], [62, -62, 6], [36, -30, 6], [62, 2, 6], [-54, 2, 0]])],

    // Files and editing
    ['file', 'document page paper terms policy pdf csv template draft', docShape(), bi(docFold())],
    ['folder', 'directory files', polygon([[-68, -48, 10], [-18, -48, 10], [-4, -32, 0], [68, -32, 10], [68, 56, 10], [-68, 56, 10]]), bi(line(-50, -12, 50, -12))],
    ['copy', 'duplicate clone', rect(-28, -28, 66, 66, 12), bi(polyline([[-46, 30], [-66, 30], [-66, -66], [30, -66], [30, -46]], 12))],
    ['clipboard', 'paste board', rect(-54, -54, 54, 68, 12), bi(rect(-24, -70, 24, -40, 8))],
    ['save', 'floppy disk store', polygon([[-64, -64, 10], [40, -64, 0], [64, -40, 10], [64, 64, 10], [-64, 64, 10]]), bi(rect(-36, -64, 30, -28, 4)), bi(rect(-36, 18, 36, 64, 4))],
    ['trash', 'delete remove bin garbage can uninstall', line(-66, -46, 66, -46), polyline([[-22, -46], [-22, -66], [22, -66], [22, -46]], 8), polygon([[-50, -46], [50, -46], [42, 64], [-42, 64]], 10), bi(line(-16, -16, -16, 36)), bi(line(16, -16, 16, 36))],
    ['pen', 'edit write pencil', rotate(polygon([[-74, 0, 0], [-46, -18, 4], [64, -18, 8], [64, 18, 8], [-46, 18, 4]]), -45), bi(rotate(line(38, -18, 38, 18), -45))],
    ['pencil', 'edit write compose draft rename editor', polyline([[-6, -60], [-60, -60], [-60, 60], [60, 60], [60, 6]], 12),
        polygon([[-14, 44, 0], [-8, 16, 4], [44, -36, 8], [64, -16, 8], [12, 36, 4]]), bi(line(30, -22, 50, -2))],
    ['book', 'address contacts directory read library manual documentation guide tutorial wiki knowledge base docs course lesson catalog story magazine author', polygon([[-52, -66], [58, -66], [58, 66], [-52, 66]], 12), bi(line(-30, -66, -30, 66)), bi(line(-8, -36, 34, -36))],
    ['code', 'developer programming brackets html api embed css javascript js markdown script', polyline([[-34, -40], [-70, 0], [-34, 40]]), polyline([[34, -40], [70, 0], [34, 40]]), bi(line(14, -58, -14, 58))],
    ['terminal', 'console command line shell prompt cli', polyline([[-58, -44], [-12, 0], [-58, 44]]), bi(line(6, 46, 60, 46))],
    ['image', 'picture photo convert converter jpg png webp format', rect(-68, -54, 68, 54, 12), bi(polyline([[-68, 40], [-20, -6], [14, 26], [32, 10], [68, 42]])), bi(circle(30, -22, 10))],
    ['camera', 'photo picture', rect(-68, -36, 68, 56, 10), polygon([[-32, -36], [-20, -56], [20, -56], [32, -36]], 4), bi(circle(0, 10, 26))],
    ['video', 'movie film camera record video call', rect(-68, -44, 30, 44, 12), bi(polygon([[30, -14], [68, -38], [68, 38], [30, 14]], 6))],
    ['music', 'song audio note sound playlist', circle(-36, 44, 16), circle(36, 32, 16), line(-20, 44, -20, -42), line(52, 32, 52, -56), line(-20, -42, 52, -56), bi(line(-20, -18, 52, -32))],
    ['play', 'start media begin resume run execute', play()],
    ['pause', 'media hold', rect(-46, -58, -14, 58, 8), rect(14, -58, 46, 58, 8)],
    ['stop', 'media end', rect(-52, -52, 52, 52, 12)],
    ['volume', 'sound audio speaker unmute', speaker(), bi(arc(4, 0, 34, -50, 50)), bi(arc(4, 0, 62, -50, 50))],
    ['volume-xmark', 'mute silent sound off', speaker(), bi(line(28, -24, 68, 16)), bi(line(28, 16, 68, -24))],
    ['microphone', 'mic audio record voice', rect(-24, -68, 24, 18, 24), bi(P(-46, -6).Q(-46, 42, 0, 42).Q(46, 42, 46, -6).end()), bi(line(0, 42, 0, 66)), bi(line(-26, 66, 26, 66))],
    ['printer', 'print', polyline([[-40, -26], [-40, -66], [40, -66], [40, -26]], 8), polygon([[-68, -26], [68, -26], [68, 34], [-68, 34]], 10), bi(rect(-40, 12, 40, 66, 6))],

    // Commerce and data
    ['dollar', 'money currency price payment cost pricing plans billing finance sell income revenue', P(44, -38).Q(36, -56, 2, -56).Q(-44, -56, -44, -28).Q(-44, -2, 0, 0).Q(46, 2, 46, 30).Q(46, 58, -2, 58).Q(-36, 58, -46, 40).end(), bi(line(0, -72, 0, -56)), bi(line(0, 58, 0, 72))],
    ['cart', 'shopping basket buy checkout', polyline([[-72, -60], [-50, -60], [-30, 30], [52, 30], [66, -32], [-42, -32]], 6), bi(circle(-22, 56, 10)), bi(circle(44, 56, 10))],
    ['credit-card', 'payment card bank billing subscription subscriptions recurring membership banking', rect(-70, -48, 70, 48, 10), bi(line(-70, -18, 70, -18)), bi(line(-46, 22, -10, 22))],
    ['tag', 'label price category pricing plans deal deals offer offers sale', polygon([[-66, -66, 10], [-6, -66, 6], [66, 6, 10], [6, 66, 10], [-66, -6, 6]]), bi(circle(-34, -34, 9))],
    ['gift', 'present reward donate', rect(-64, -20, 64, 64, 10), line(-70, -20, 70, -20), bi(line(0, -20, 0, 64)), bi(P(0, -20).Q(-50, -34, -42, -58).Q(-26, -76, 0, -20).Q(26, -76, 42, -58).Q(50, -34, 0, -20))],
    ['bar', 'chart graph statistics analytics insights report reports stats metrics column', bi(line(-44, 62, -44, 8)), line(0, 62, 0, -62), bi(line(44, 62, 44, -22))],
    ['line', 'chart graph statistics trend analytics insights finance investments investor investors revenue profit stock', polyline([[-66, 44], [-24, -6], [12, 22], [66, -50]], 6)],
    ['chart-pie', 'graph statistics share insights report budget', ring(), bi(polyline([[0, -70], [0, 0], [60, 36]]))],
    ['database', 'storage data server cache sql', ellipse(0, -46, 58, 22), P(-58, -46).L(-58, 46).Q(-58, 70, 0, 70).Q(58, 70, 58, 46).L(58, -46).end(), bi(P(-58, 0).Q(-58, 24, 0, 24).Q(58, 24, 58, 0).end())],
    ['server', 'hosting computer rack api endpoint uptime docker container', rect(-66, -62, 66, -6, 10), rect(-66, 6, 66, 62, 10), bi(dot(-40, -34)), bi(dot(-40, 34))],
    ['battery', 'power charge energy', rect(-70, -36, 54, 36, 10), line(70, -14, 70, 14), bi(rect(-50, -16, 6, 16, 4))],
    ['bolt', 'lightning power energy fast flash', polygon([[14, -72], [-50, 10], [-4, 10], [-14, 72], [50, -10], [4, -10]])],
    ['lightbulb', 'idea tip hint', P(-24, 30).Q(-24, 12, -38, -2).A(0, -30, 47, 143, 397).Q(24, 12, 24, 30).close(), bi(line(-20, 50, 20, 50)), bi(line(-12, 68, 12, 68))],

    // Nature and weather
    ['sun', 'light day weather bright mode theme', circle(0, 0, 26), ...[0, 45, 90, 135, 180, 225, 270, 315].map(deg => bi(ray(deg)))],
    ['moon', 'night dark mode sleep theme', crescent(), bi(circle(...at(0, 0, 46, 30), 7)), bi(circle(...at(0, 0, 50, 80), 4))],
    ['cloud', 'weather storage upload sync backup', move(scale(cloudOutline(), 0.76), 0, 1), bi(move(scale(arc(2, -14, 42, 205, 260), 0.76), 0, 1))],
    ['heart', 'love like favorite donate donation wishlist saved', P(0, 62).Q(-74, 8, -68, -28).Q(-62, -66, -26, -62).Q(-8, -60, 0, -42).Q(8, -60, 26, -62).Q(62, -66, 68, -28).Q(74, 8, 0, 62), bi(arc(-32, -24, 20, 195, 265))],
    ['star', 'favorite rating bookmark featured recommended review reviews', polygon(Array.from({ length: 10 }, (_, i) => at(0, 6, i % 2 ? 32 : 76, -90 + 36 * i))), bi(polygon(Array.from({ length: 10 }, (_, i) => at(0, 6, i % 2 ? 12 : 30, -90 + 36 * i))))],
    ['bookmark', 'save mark read later saved', polygon([[-44, -68, 10], [44, -68, 10], [44, 66, 2], [0, 30, 2], [-44, 66, 2]]), bi(line(-24, -42, 24, -42))],
    ['trophy', 'award winner prize achievement', P(-42, -64).L(42, -64).L(42, -14).Q(42, 26, 0, 26).Q(-42, 26, -42, -14).close(), bi(polyline([[-42, -50], [-66, -50], [-66, -30], [-42, -8]], 8)), bi(polyline([[42, -50], [66, -50], [66, -30], [42, -8]], 8)), line(0, 26, 0, 50), line(-30, 64, 30, 64)],
    ['test', 'lab experiment flask science beaker beta', polygon([[-22, -60, 0], [22, -60, 0], [22, -18, 0], [64, 56, 12], [-64, 56, 12], [-22, -18, 0]]), line(-34, -62, 34, -62), bi(P(-46, 22).Q(-22, 8, 0, 22).Q(22, 36, 46, 22).end())],
    ['traffic-cone', 'construction under work caution', polygon([[-12, -68], [12, -68], [46, 50], [-46, 50]], 8), line(-70, 62, 70, 62), bi(line(-26, -18, 26, -18)), bi(line(-36, 16, 36, 16))],
    ['thumbs-up', 'like approve good agree dislike thumbs down vote upvote downvote', bi(rect(-70, -8, -46, 62, 6)),
        P(-40, -8).L(-14, -50).Q(-6, -70, 8, -62).Q(18, -56, 14, -36).L(8, -14).L(50, -14).Q(66, -14, 62, 2).L(52, 50).Q(48, 62, 36, 62).L(-40, 62).close()],
];

/** Icons whose artwork is kept as it is: brand logos, and hand drawn pictures. */
export const KEEP = ['discord', 'facebook', 'instagram', 'jwt', 'handshake', 'icons'];
