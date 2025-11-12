const orderModalEl = document.getElementById('orderModal');
const orderModal = orderModalEl ? new bootstrap.Modal(orderModalEl) : null;

let COURSES = [];
let TUTORS = [];
let selectedCourse = null;
let selectedTutor = null;

function paginate(arr, page, size) {
  const start = (page - 1) * size;
  return arr.slice(start, start + size);
}
function renderPagination(containerId, total, page, size, onClick) {
  const pages = Math.max(1, Math.ceil(total / size));
  const ul = document.getElementById(containerId);
  ul.innerHTML = '';
  const addItem = (label, p, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
    li.addEventListener('click', e => { e.preventDefault(); if (!disabled) onClick(p); });
    ul.appendChild(li);
  };
  addItem('«', page - 1, page === 1);
  for (let i = 1; i <= pages; i++) addItem(i, i, false, i === page);
  addItem('»', page + 1, page === pages);
}

let coursePage = 1;
const COURSE_PAGE_SIZE = 10;

function filterCourses() {
  const q = document.getElementById('courseSearch').value.trim().toLowerCase();
  const lvl = document.getElementById('courseLevel').value;
  return COURSES.filter(c => {
    const okName = !q || c.name.toLowerCase().includes(q);
    const okLvl = !lvl || c.level === lvl;
    return okName && okLvl;
  });
}

function renderCourses(page = 1) {
  const list = document.getElementById('coursesList');
  const data = filterCourses();
  coursePage = page;
  const pageData = paginate(data, page, COURSE_PAGE_SIZE);

  list.innerHTML = '';
  pageData.forEach(c => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `list-group-item list-group-item-action list-group-item-selectable ${selectedCourse?.id===c.id ? 'active' : ''}`;
    item.title = c.description;
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${c.name}</div>
          <div class="small text-body-secondary truncate-2">${c.description}</div>
          <div class="small mt-1">
            Преподаватель: <span class="fw-medium">${c.teacher}</span> •
            Уровень: <span class="fw-medium">${c.level}</span> •
            ${c.total_length} нед • ${c.week_length} ч/нед •
            ${c.course_fee_per_hour} ₽/ч
          </div>
        </div>
        <span class="badge text-bg-primary align-self-start">ID ${c.id}</span>
      </div>`;
    item.addEventListener('click', () => {
      selectedCourse = c;
      selectedTutor = null;
      document.getElementById('openOrderModalFromCourses').disabled = false;
      document.getElementById('openOrderModalFromTutors').disabled = true;
      renderCourses(coursePage);
      document.querySelectorAll('#tutorsList .active')?.forEach(n=>n.classList.remove('active'));
    });
    list.appendChild(item);
  });

  renderPagination('coursesPagination', data.length, page, COURSE_PAGE_SIZE, p => renderCourses(p));
}

function filterTutors() {
  const lvl = document.getElementById('tutorLevel').value;
  const lang = document.getElementById('tutorLang').value.trim().toLowerCase();
  const exp = parseInt(document.getElementById('tutorExp').value || '0', 10);

  return TUTORS.filter(t => {
    const okLevel = !lvl || t.language_level === lvl;
    const okExp = t.work_experience >= exp;
    const okLang = !lang || (t.languages_offered.join(',') + ',' + t.languages_spoken.join(',')).toLowerCase().includes(lang);
    return okLevel && okExp && okLang;
  });
}

function renderTutors() {
  const list = document.getElementById('tutorsList');
  const data = filterTutors();
  list.innerHTML = '';
  data.forEach(t => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `list-group-item list-group-item-action list-group-item-selectable ${selectedTutor?.id===t.id ? 'active' : ''}`;
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${t.name} <span class="badge text-bg-secondary">${t.language_level}</span></div>
          <div class="small">Языки: ${t.languages_offered.join(', ')}</div>
          <div class="small text-body-secondary">Говорит: ${t.languages_spoken.join(', ')} • Опыт: ${t.work_experience} лет • ${t.price_per_hour} ₽/ч</div>
        </div>
        <span class="badge text-bg-primary align-self-start">ID ${t.id}</span>
      </div>`;
    item.addEventListener('click', () => {
      selectedTutor = t;
      selectedCourse = null;
      document.getElementById('openOrderModalFromTutors').disabled = false;
      document.getElementById('openOrderModalFromCourses').disabled = true;
      renderTutors();
      document.querySelectorAll('#coursesList .active')?.forEach(n=>n.classList.remove('active'));
    });
    list.appendChild(item);
  });
}

function initMap() {
  const map = L.map('resourcesMap', { zoomControl: true }).setView([55.75, 37.61], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
  L.marker([55.751,37.62]).addTo(map).bindPopup('Городская библиотека №1');
  L.marker([55.741,37.6]).addTo(map).bindPopup('Языковое кафе Lingua');
  L.circle([55.76,37.58], {radius:600, color:'#0d6efd'}).addTo(map).bindPopup('Студенческий кампус');
}

function resetOrderModal() {
  document.getElementById('orderFor').value = '';
  document.getElementById('orderCourseId').value = '';
  document.getElementById('orderTutorId').value = '';
  document.getElementById('orderTitle').value = '';
  document.getElementById('orderTeacher').value = '';
  document.getElementById('orderDate').innerHTML = '';
  document.getElementById('orderTime').innerHTML = '';
  document.getElementById('orderTime').disabled = true;
  document.getElementById('orderDuration').value = 1;
  document.getElementById('orderPersons').value = 1;
  document.getElementById('courseLenInfo').hidden = true;

  ['optEarly','optGroup','optIntensive','optSupp','optPers','optExcur','optAssess','optInteractive']
    .forEach(id => { const el = document.getElementById(id); el.checked = false; });
}

function openOrderForCourse(c) {
  resetOrderModal();
  document.getElementById('orderFor').value = 'course';
  document.getElementById('orderCourseId').value = c.id;
  document.getElementById('orderTitle').value = c.name;
  document.getElementById('orderTeacher').value = c.teacher;
  document.getElementById('orderTeacherWrap').hidden = false;

  const datesMap = {}; 
  c.start_dates.forEach(dt => {
    const d = new Date(dt);
    const dateStr = d.toISOString().slice(0,10);
    const timeStr = d.toTimeString().slice(0,5);
    if (!datesMap[dateStr]) datesMap[dateStr] = [];
    datesMap[dateStr].push(timeStr);
  });

  const dateSel = document.getElementById('orderDate');
  dateSel.innerHTML = `<option value="">Выберите дату...</option>`;
  Object.keys(datesMap).sort().forEach(dateStr => {
    const opt = document.createElement('option');
    opt.value = dateStr;
    opt.textContent = dateStr;
    dateSel.appendChild(opt);
  });

  dateSel.onchange = () => {
    const v = dateSel.value;
    const timeSel = document.getElementById('orderTime');
    timeSel.innerHTML = '';
    timeSel.disabled = !v;
    if (v) {
      datesMap[v].sort().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = `${t}–${addHoursToTime(t, c.week_length)}`;
        timeSel.appendChild(opt);
      });
    }
    recalcPrice(); 
  };

  document.getElementById('courseLenInfo').hidden = false;
  document.getElementById('courseWeeks').textContent = c.total_length;
  document.getElementById('courseHoursWeek').textContent = c.week_length;

  document.getElementById('courseEndDate').textContent = '—';
  dateSel.addEventListener('change', () => {
    if (!dateSel.value) return;
    const d = new Date(dateSel.value + 'T00:00:00');
    d.setDate(d.getDate() + (c.total_length - 1) * 7);
    document.getElementById('courseEndDate').textContent = d.toISOString().slice(0,10);
  });

  document.getElementById('durationWrap').classList.add('d-none');

  orderModal.show();
  recalcPrice();
}

function openOrderForTutor(t) {
  resetOrderModal();
  document.getElementById('orderFor').value = 'tutor';
  document.getElementById('orderTutorId').value = t.id;
  document.getElementById('orderTitle').value = t.name + ' (репетитор)';
  document.getElementById('orderTeacherWrap').hidden = true;

  const dateSel = document.getElementById('orderDate');
  dateSel.innerHTML = '';
  const today = new Date();
  for (let i=0; i<14; i++) {
    const d = new Date(today); d.setDate(d.getDate()+i+1);
    const ds = d.toISOString().slice(0,10);
    const opt = document.createElement('option'); opt.value = ds; opt.textContent = ds;
    dateSel.appendChild(opt);
  }
  const timeSel = document.getElementById('orderTime');
  timeSel.disabled = false;
  timeSel.innerHTML = '';
  ['09:00','12:00','15:00','18:00','19:00'].forEach(t => {
    const opt = document.createElement('option'); opt.value = t; opt.textContent = t;
    timeSel.appendChild(opt);
  });

  document.getElementById('durationWrap').classList.remove('d-none');

  document.getElementById('courseLenInfo').hidden = true;

  orderModal.show();
  recalcPrice();
}

function addHoursToTime(timeHHMM, hours) {
  const [h,m] = timeHHMM.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setHours(d.getHours() + hours);
  return d.toTimeString().slice(0,5);
}
function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0-вс, 6-сб
  return day === 0 || day === 6;
}
function inRange(timeHHMM, fromH, toH) {
  const h = parseInt(timeHHMM.split(':')[0], 10);
  return h >= fromH && h < toH;
}

function recalcPrice() {
  const who = document.getElementById('orderFor').value;
  if (!who) return;

  const persons = +document.getElementById('orderPersons').value || 1;
  const date = document.getElementById('orderDate').value || new Date().toISOString().slice(0,10);
  const time = document.getElementById('orderTime').value || '09:00';

  let feePerHour = 0;
  let durationHours = 0;
  let weeks = 1;

  if (who === 'course') {
    const c = COURSES.find(x => x.id === +document.getElementById('orderCourseId').value);
    if (!c) return;
    feePerHour = c.course_fee_per_hour;
    durationHours = c.total_length * c.week_length; 
    weeks = c.total_length;

    // автоопции
    const early = (new Date(date) - new Date()) / (1000*60*60*24) >= 30;
    const intensive = c.week_length > 20;
    document.getElementById('optEarly').checked = early;
    document.getElementById('optIntensive').checked = intensive;

  } else {
    const t = TUTORS.find(x => x.id === +document.getElementById('orderTutorId').value);
    if (!t) return;
    feePerHour = t.price_per_hour;
    durationHours = +document.getElementById('orderDuration').value || 1;
    weeks = Math.max(1, Math.ceil(durationHours / 5));

    const early = (new Date(date) - new Date()) / (1000*60*60*24) >= 30;
    const intensive = durationHours > 20;
    document.getElementById('optEarly').checked = early;
    document.getElementById('optIntensive').checked = intensive;
  }

  document.getElementById('optGroup').checked = persons >= 5;

  const weekendMult = isWeekend(date) ? 1.5 : 1;

  const morningSurcharge = inRange(time, 9, 12) ? 400 : 0;
  const eveningSurcharge = inRange(time, 18, 20) ? 1000 : 0;

  let total = ((feePerHour * durationHours * weekendMult) + morningSurcharge + eveningSurcharge) * persons;

  const supp = document.getElementById('optSupp').checked ? 2000 * persons : 0;
  const pers = document.getElementById('optPers').checked ? 1500 * weeks : 0;
  const excur = document.getElementById('optExcur').checked ? total * 0.25 : 0;
  const assess = document.getElementById('optAssess').checked ? 300 : 0;
  const interactive = document.getElementById('optInteractive').checked ? (total * 0.5) : 0;
  total += supp + pers + excur + assess + interactive;

  if (document.getElementById('optEarly').checked) total *= 0.9;
  if (document.getElementById('optGroup').checked) total *= 0.85;
  if (document.getElementById('optIntensive').checked) total *= 1.2;

  document.getElementById('totalPrice').textContent = Math.round(total);
  document.getElementById('priceHints').textContent =
    `Базовая ставка: ${feePerHour} ₽/ч, длит.: ${durationHours} ч, студентов: ${persons}, коэффициент выходного: ${weekendMult}`;
}

['orderDate','orderTime','orderDuration','orderPersons','optSupp','optPers','optExcur','optAssess','optInteractive']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', recalcPrice);
  });
document.getElementById('recalcBtn')?.addEventListener('click', recalcPrice);

document.getElementById('submitOrderBtn')?.addEventListener('click', async () => {
  try {
    const who = document.getElementById('orderFor').value;
    if (!who) return;

    const date = document.getElementById('orderDate').value;
    const time = document.getElementById('orderTime').value;
    const persons = +document.getElementById('orderPersons').value || 1;
    const price = +document.getElementById('totalPrice').textContent || 0;

    const payload = {
      tutor_id: 0,
      course_id: 0,
      date_start: date,
      time_start: time,
      duration: 1,
      persons,
      price,
      early_registration: !!document.getElementById('optEarly').checked,
      group_enrollment: !!document.getElementById('optGroup').checked,
      intensive_course: !!document.getElementById('optIntensive').checked,
      supplementary: !!document.getElementById('optSupp').checked,
      personalized: !!document.getElementById('optPers').checked,
      excursions: !!document.getElementById('optExcur').checked,
      assessment: !!document.getElementById('optAssess').checked,
      interactive: !!document.getElementById('optInteractive').checked
    };

    if (who === 'course') {
      const c = COURSES.find(x => x.id === +document.getElementById('orderCourseId').value);
      payload.course_id = c.id;
      payload.duration = c.total_length * c.week_length; 
    } else {
      const t = TUTORS.find(x => x.id === +document.getElementById('orderTutorId').value);
      payload.tutor_id = t.id;
      payload.duration = +document.getElementById('orderDuration').value || 1;
    }

    const created = await apiPost('/api/orders', payload);
    orderModal.hide();
    showAlert('Заявка успешно создана! ID: ' + created.id, 'success');
  } catch (e) {
    showAlert('Ошибка при создании заявки: ' + e.message, 'danger');
  }
});

(async function init() {
  try {
    [COURSES, TUTORS] = await Promise.all([
      apiGet('/api/courses'),
      apiGet('/api/tutors'),
    ]);

    renderCourses();
    renderTutors();
    initMap();

    document.getElementById('courseSearch').addEventListener('input', () => renderCourses(1));
    document.getElementById('courseLevel').addEventListener('change', () => renderCourses(1));

    ['tutorLevel','tutorLang','tutorExp'].forEach(id =>
      document.getElementById(id).addEventListener('input', renderTutors));

    document.getElementById('openOrderModalFromCourses').addEventListener('click', () => {
      if (selectedCourse) openOrderForCourse(selectedCourse);
    });
    document.getElementById('openOrderModalFromTutors').addEventListener('click', () => {
      if (selectedTutor) openOrderForTutor(selectedTutor);
    });

  } catch (e) {
    showAlert('Не удалось загрузить данные: ' + e.message, 'danger');
  }
})();
