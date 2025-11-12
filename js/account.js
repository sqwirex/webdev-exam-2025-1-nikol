const ORDERS_PAGE_SIZE = 5;
let ORDERS = [];
let ordersPage = 1;

function fmtDate(s) { return s || '—'; }
function fmtMoney(v) { return (v||0).toLocaleString('ru-RU'); }

function renderOrders(page = 1) {
  ordersPage = page;
  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = '';
  const pageData = paginate(ORDERS, page, ORDERS_PAGE_SIZE);

  pageData.forEach((o, idx) => {
    const tr = document.createElement('tr');

    const title = o.course_id ? `Курс #${o.course_id}` : `Репетитор #${o.tutor_id}`;
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${title}</td>
      <td>${fmtDate(o.date_start)}</td>
      <td>${o.time_start || '—'}</td>
      <td>${fmtMoney(o.price)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-info text-white" data-action="details">Подробнее</button>
          <button class="btn btn-warning" data-action="edit">Изменить</button>
          <button class="btn btn-danger" data-action="delete">Удалить</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-action="details"]').addEventListener('click', () => openDetails(o));
    tr.querySelector('[data-action="edit"]').addEventListener('click', () => openEdit(o));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => openDelete(o));

    tbody.appendChild(tr);
  });

  renderPagination('ordersPagination', ORDERS.length, page, ORDERS_PAGE_SIZE, p => renderOrders(p));
}

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

const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
function openDetails(o) {
  const list = `
    <div class="row g-3">
      <div class="col-md-6">
        <div class="border rounded-3 p-3 h-100">
          <div class="fw-semibold mb-2">Общие</div>
          <div>№: <b>${o.id}</b></div>
          <div>Тип: <b>${o.course_id ? 'Курс' : 'Репетитор'}</b></div>
          <div>Дата: <b>${fmtDate(o.date_start)}</b></div>
          <div>Время: <b>${o.time_start || '—'}</b></div>
          <div>Длительность (ч): <b>${o.duration}</b></div>
          <div>Студентов: <b>${o.persons}</b></div>
          <div>Сумма: <b>${fmtMoney(o.price)} ₽</b></div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="border rounded-3 p-3 h-100">
          <div class="fw-semibold mb-2">Опции</div>
          <ul class="mb-0">
            <li>Ранняя регистрация: <b>${o.early_registration ? 'Да' : 'Нет'}</b></li>
            <li>Групповая запись: <b>${o.group_enrollment ? 'Да' : 'Нет'}</b></li>
            <li>Интенсив: <b>${o.intensive_course ? 'Да' : 'Нет'}</b></li>
            <li>Материалы: <b>${o.supplementary ? 'Да' : 'Нет'}</b></li>
            <li>Индивидуальные: <b>${o.personalized ? 'Да' : 'Нет'}</b></li>
            <li>Экскурсии: <b>${o.excursions ? 'Да' : 'Нет'}</b></li>
            <li>Оценка уровня: <b>${o.assessment ? 'Да' : 'Нет'}</b></li>
            <li>Интерактив: <b>${o.interactive ? 'Да' : 'Нет'}</b></li>
          </ul>
        </div>
      </div>
    </div>
  `;
  document.getElementById('detailsBody').innerHTML = list;
  detailsModal.show();
}

const editModal = new bootstrap.Modal(document.getElementById('editModal'));
function openEdit(o) {
  document.getElementById('editOrderId').value = o.id;
  document.getElementById('editDate').value = o.date_start || '';
  document.getElementById('editTime').value = o.time_start || '';
  document.getElementById('editDuration').value = o.duration || 1;
  document.getElementById('editPersons').value = o.persons || 1;

  document.getElementById('editSupp').checked = !!o.supplementary;
  document.getElementById('editPers').checked = !!o.personalized;
  document.getElementById('editExcur').checked = !!o.excursions;
  document.getElementById('editAssess').checked = !!o.assessment;
  document.getElementById('editInteractive').checked = !!o.interactive;

  editModal.show();
}

document.getElementById('saveEditBtn').addEventListener('click', async () => {
  try {
    const id = document.getElementById('editOrderId').value;

    const payload = {
      date_start: document.getElementById('editDate').value || null,
      time_start: document.getElementById('editTime').value || null,
      duration: +document.getElementById('editDuration').value || 1,
      persons: +document.getElementById('editPersons').value || 1,
      supplementary: !!document.getElementById('editSupp').checked,
      personalized: !!document.getElementById('editPers').checked,
      excursions: !!document.getElementById('editExcur').checked,
      assessment: !!document.getElementById('editAssess').checked,
      interactive: !!document.getElementById('editInteractive').checked,
      early_registration: false,
      group_enrollment: false,
      intensive_course: false
    };

    const updated = await apiPut(`/api/orders/${id}`, payload);
    const idx = ORDERS.findIndex(x => x.id === updated.id);
    if (idx >= 0) ORDERS[idx] = updated;

    editModal.hide();
    renderOrders(ordersPage);
    showAlert('Заявка обновлена', 'success');
  } catch (e) {
    showAlert('Ошибка при обновлении: ' + e.message, 'danger');
  }
});

const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
function openDelete(o) {
  document.getElementById('deleteOrderId').value = o.id;
  deleteModal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  try {
    const id = document.getElementById('deleteOrderId').value;
    await apiDelete(`/api/orders/${id}`);
    ORDERS = ORDERS.filter(o => o.id !== +id);
    deleteModal.hide();
    renderOrders(1);
    showAlert('Заявка удалена', 'success');
  } catch (e) {
    showAlert('Ошибка при удалении: ' + e.message, 'danger');
  }
});

(async function init() {
  try {
    ORDERS = await apiGet('/api/orders');
    renderOrders(1);
  } catch (e) {
    showAlert('Не удалось загрузить заявки: ' + e.message, 'danger');
  }
})();
