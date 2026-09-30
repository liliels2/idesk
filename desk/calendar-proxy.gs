/**
 * estdesk 캘린더 프록시 — Google Apps Script
 *
 * 브라우저에서 OAuth를 하지 않고 캘린더를 읽기 위한 작은 중계기입니다.
 * 스크립트가 "나로 실행"되므로 토큰 만료도, 팝업도, 계정 선택창도 없습니다.
 *
 * ── 설치 (한 번만, 약 2분) ────────────────────────────────────────────
 * 1. https://script.google.com 에서 새 프로젝트 만들기
 * 2. 이 파일 내용을 전부 붙여넣기
 * 3. 아래 SECRET 을 아무도 못 맞출 긴 문자열로 바꾸기
 * 4. 배포 → 새 배포 → 유형: 웹 앱
 *      - 실행 계정: 나
 *      - 액세스 권한: 모든 사용자
 * 5. 나오는 /exec 주소 끝에 ?key=<SECRET> 을 붙여서
 *    대시보드 설정의 "캘린더 주소" 칸에 넣기
 *
 * ── 알아둘 것 ────────────────────────────────────────────────────────
 * 이 주소를 아는 사람은 누구나 일정 제목과 시간을 읽을 수 있습니다.
 * SECRET 을 충분히 길게 잡고, 주소를 공유하지 마세요.
 * 유출된 것 같으면 SECRET 만 바꿔서 다시 배포하면 즉시 막힙니다.
 */

var SECRET = 'CHANGE_ME_TO_SOMETHING_LONG_AND_RANDOM';

var HOLIDAY_CAL = 'ko.south_korea#holiday@group.v.calendar.google.com';

function doGet(e) {
  var p = (e && e.parameter) || {};

  if (!SECRET || SECRET === 'CHANGE_ME_TO_SOMETHING_LONG_AND_RANDOM') {
    return json({ error: 'SECRET을 먼저 바꿔주세요' });
  }
  if (p.key !== SECRET) {
    return json({ error: 'unauthorized' });
  }

  var from = p.from ? new Date(p.from) : new Date();
  var to   = p.to   ? new Date(p.to)   : new Date(from.getTime() + 90 * 86400000);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return json({ error: 'bad date range' });
  }

  var out = { items: [], holidays: [] };

  try {
    out.items = read(CalendarApp.getDefaultCalendar(), from, to);
  } catch (err) {
    return json({ error: String(err) });
  }

  // 공휴일은 없어도 나머지는 살려서 돌려준다
  try {
    var hol = CalendarApp.getCalendarById(HOLIDAY_CAL);
    if (hol) out.holidays = read(hol, from, to);
  } catch (err) {}

  return json(out);
}

/** 대시보드가 Calendar API 응답과 같은 모양으로 읽을 수 있게 맞춘다 */
function read(cal, from, to) {
  var tz = cal.getTimeZone() || Session.getScriptTimeZone();
  return cal.getEvents(from, to).map(function (ev) {
    var start = ev.getStartTime();
    var allDay = ev.isAllDayEvent();
    return {
      summary: ev.getTitle(),
      start: allDay
        ? { date: Utilities.formatDate(start, tz, 'yyyy-MM-dd') }
        : { dateTime: start.toISOString() }
    };
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
