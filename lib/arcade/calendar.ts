import { playSfx } from './audio';

const EVENT_START_UTC = '20270212T060000Z';
const EVENT_END_UTC = '20270212T130000Z';

export function downloadIcsCalendar() {
  playSfx('coin');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jero and Viah//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:jero-viah-wedding-20270212@invitation',
    `DTSTAMP:${stamp}`,
    `DTSTART:${EVENT_START_UTC}`,
    `DTEND:${EVENT_END_UTC}`,
    'SUMMARY:Jero & Viah Wedding (Baguio City)',
    "LOCATION:St. Aloysius Gonzaga Parish Church\\, SLU\\, 28 Lower Bonifacio St\\, Baguio\\, 2600 Benguet",
    "DESCRIPTION:Ceremony 2:00 PM at St. Aloysius Gonzaga Parish Church. Reception follows at Teacher's Camp. Motif: sage\\, eucalyptus\\, slate blue\\, dusty blue (no white).",
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Jero-Viah-Wedding-2027.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function openGoogleCalendar() {
  playSfx('coin');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Jero & Viah Wedding',
    dates: `${EVENT_START_UTC}/${EVENT_END_UTC}`,
    location: 'St. Aloysius Gonzaga Parish Church, 28 Lower Bonifacio St, Baguio, 2600 Benguet'
  });
  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener');
}

