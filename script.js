const grid = document.querySelector('#calendar-grid');
const monthTitle = document.querySelector('#month-title');
const agendaTitle = document.querySelector('#agenda-title');
const agendaDate = document.querySelector('#agenda-date');
const agendaList = document.querySelector('#agenda-list');
const dialog = document.querySelector('#event-dialog');
const form = document.querySelector('#event-form');
const dateInput = document.querySelector('#event-date');
const today = new Date();
today.setHours(0, 0, 0, 0);
let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today);
const storageKey = 'daylight-calendar-events-v1';
let events = readEvents();

function readEvents() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.filter(item => item && item.id && item.name && item.date) : [];
  } catch {
    return [];
  }
}
function saveEvents() {
  try { localStorage.setItem(storageKey, JSON.stringify(events)); }
  catch { alert('Could not save your event. Your browser storage may be full or disabled.'); }
}
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function fromDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}
function sameDay(a, b) { return dateKey(a) === dateKey(b); }
function formatDate(date, options) { return new Intl.DateTimeFormat(undefined, options).format(date); }

function renderCalendar() {
  monthTitle.textContent = formatDate(displayedMonth, { month: 'long', year: 'numeric' });
  grid.replaceChildren();
  const firstDay = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
  const start = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay());
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dateKey(date);
    const dayEvents = events.filter(event => event.date === key);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'day-cell';
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `${formatDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`);
    if (date.getMonth() !== displayedMonth.getMonth()) button.classList.add('outside-month');
    if (sameDay(date, today)) button.classList.add('today');
    if (sameDay(date, selectedDate)) button.classList.add('selected');
    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = date.getDate();
    button.append(number);
    if (dayEvents.length) {
      const dots = document.createElement('span');
      dots.className = 'event-dots';
      dots.setAttribute('aria-hidden', 'true');
      dayEvents.slice(0, 3).forEach(event => {
        const dot = document.createElement('i');
        dot.className = `event-dot ${event.color || 'violet'}`;
        dots.append(dot);
      });
      button.append(dots);
    }
    button.addEventListener('click', () => {
      selectedDate = date;
      if (date.getMonth() !== displayedMonth.getMonth()) displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      render();
    });
    grid.append(button);
  }
}

function renderAgenda() {
  const isToday = sameDay(selectedDate, today);
  agendaTitle.textContent = isToday ? 'Coming up' : formatDate(selectedDate, { weekday: 'long' });
  agendaDate.textContent = formatDate(selectedDate, { month: 'short', day: 'numeric' });
  agendaList.replaceChildren();
  const selectedEvents = events.filter(event => event.date === dateKey(selectedDate)).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  if (!selectedEvents.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const illustration = document.createElement('div');
    illustration.className = 'empty-illustration';
    illustration.setAttribute('aria-hidden', 'true');
    illustration.textContent = '✦';
    const message = document.createElement('div');
    message.textContent = isToday ? 'A little breathing room. Add something you’re looking forward to.' : 'Nothing planned for this day yet.';
    empty.append(illustration, message);
    agendaList.append(empty);
    return;
  }
  selectedEvents.forEach(event => {
    const card = document.createElement('article');
    card.className = `event-card ${event.color || 'violet'}`;
    const time = document.createElement('span');
    time.className = 'event-time';
    time.textContent = event.time ? formatDate(new Date(`2000-01-01T${event.time}`), { hour: 'numeric', minute: '2-digit' }) : 'Anytime';
    const details = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'event-name';
    name.textContent = event.name;
    details.append(name);
    if (!isToday) {
      const date = document.createElement('p');
      date.className = 'event-date-small';
      date.textContent = formatDate(selectedDate, { month: 'long', day: 'numeric' });
      details.append(date);
    }
    const remove = document.createElement('button');
    remove.className = 'delete-event';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${event.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      events = events.filter(item => item.id !== event.id);
      saveEvents();
      render();
    });
    card.append(time, details, remove);
    agendaList.append(card);
  });
}

function render() { renderCalendar(); renderAgenda(); }
function openDialog() {
  dateInput.value = dateKey(selectedDate);
  form.reset();
  dateInput.value = dateKey(selectedDate);
  dialog.showModal();
  document.querySelector('#event-name').focus();
}

document.querySelector('#previous-month').addEventListener('click', () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.querySelector('#next-month').addEventListener('click', () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});
document.querySelector('#today-button').addEventListener('click', () => {
  selectedDate = new Date(today);
  displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  render();
});
document.querySelector('#add-event-button').addEventListener('click', openDialog);
document.querySelector('#agenda-add-button').addEventListener('click', openDialog);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const date = String(data.get('date') || '');
  if (!name || !date) return;
  events.push({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, name, date, time: String(data.get('time') || ''), color: String(data.get('color') || 'violet') });
  selectedDate = fromDateKey(date);
  displayedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  saveEvents();
  dialog.close();
  render();
});

render();
