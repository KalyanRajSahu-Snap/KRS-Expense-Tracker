const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const filterDate = document.getElementById('filter-date');
const filterCategory = document.getElementById('filter-category');
const filterName = document.getElementById('filter-name');
const applyFilterBtn = document.getElementById('apply-filter');
const clearFilterBtn = document.getElementById('clear-filter');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit');
const downloadBtn = document.getElementById('download-btn');
const downloadModal = document.getElementById('download-modal');
const downloadForm = document.getElementById('download-form');
const cancelDownloadBtn = document.getElementById('cancel-download');

// Get transactions from local storage
const localStorageTransactions = JSON.parse(
  localStorage.getItem(`transactions_${localStorage.getItem('currentUser')}`)
);

let transactions =
  localStorage.getItem(`transactions_${localStorage.getItem('currentUser')}`) !== null ? localStorageTransactions : [];

let currentEditId = null;

// Add transaction
function addTransaction(e, isIncome) {
  e.preventDefault();

  const form = isIncome ? incomeForm : expenseForm;
  const text = form.querySelector(`#${isIncome ? 'income' : 'expense'}-text`);
  const amount = form.querySelector(`#${isIncome ? 'income' : 'expense'}-amount`);
  const category = form.querySelector(`#${isIncome ? 'income' : 'expense'}-category`);
  const date = form.querySelector(`#${isIncome ? 'income' : 'expense'}-date`);

  if (text.value.trim() === '' || amount.value.trim() === '' || category.value === '' || date.value === '') {
    alert('Please add a description, amount, category, and date');
  } else {
    const transaction = {
      id: generateID(),
      text: text.value,
      amount: isIncome ? +amount.value : -amount.value,
      category: category.value,
      date: date.value
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);

    updateValues();

    updateLocalStorage();

    text.value = '';
    amount.value = '';
    category.value = '';
    date.value = '';
  }
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';

  const item = document.createElement('li');

  // Add class based on value
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    ${transaction.text} <span>${sign}${Math.abs(
    transaction.amount
  )}</span> <span>${transaction.category}</span> <span>${transaction.date}</span>
    <button class="delete-btn" onclick="removeTransaction(${
      transaction.id
    })">x</button>
    <button class="edit-btn" onclick="editTransaction(${
      transaction.id
    })">Edit</button>
  `;

  list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const amounts = transactions.map(transaction => transaction.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);

  const expense = (
    amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);

  balance.innerText = `$${total}`;
  money_plus.innerText = `$${income}`;
  money_minus.innerText = `$${expense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);

  updateLocalStorage();

  init();
}

// Edit transaction
function editTransaction(id) {
  currentEditId = id;
  const transaction = transactions.find(transaction => transaction.id === id);

  document.getElementById('edit-text').value = transaction.text;
  document.getElementById('edit-amount').value = Math.abs(transaction.amount);
  document.getElementById('edit-category').value = transaction.category;
  document.getElementById('edit-date').value = transaction.date;

  editModal.style.display = 'block';
}

// Update transaction
function updateTransaction(e) {
  e.preventDefault();

  const text = document.getElementById('edit-text').value;
  const amount = document.getElementById('edit-amount').value;
  const category = document.getElementById('edit-category').value;
  const date = document.getElementById('edit-date').value;

  if (text.trim() === '' || amount.trim() === '' || category === '' || date === '') {
    alert('Please fill in all fields');
    return;
  }

  const updatedTransaction = {
    id: currentEditId,
    text: text,
    amount: transactions.find(t => t.id === currentEditId).amount > 0 ? +amount : -amount,
    category: category,
    date: date
  };

  const index = transactions.findIndex(t => t.id === currentEditId);
  transactions[index] = updatedTransaction;

  updateLocalStorage();
  init();
  closeEditModal();
}

// Close edit modal
function closeEditModal() {
  editModal.style.display = 'none';
  currentEditId = null;
}

// Update local storage transactions
function updateLocalStorage() {
  localStorage.setItem(`transactions_${localStorage.getItem('currentUser')}`, JSON.stringify(transactions));
}

// Filter transactions
function filterTransactions() {
  const date = filterDate.value;
  const category = filterCategory.value;
  const name = filterName.value.toLowerCase();

  const filteredTransactions = transactions.filter(transaction => {
    const dateMatch = !date || transaction.date === date;
    const categoryMatch = !category || transaction.category === category;
    const nameMatch = !name || transaction.text.toLowerCase().includes(name);

    return dateMatch && categoryMatch && nameMatch;
  });

  list.innerHTML = '';
  filteredTransactions.forEach(addTransactionDOM);
  updateValues();
}

// Clear filters
function clearFilters() {
  filterDate.value = '';
  filterCategory.value = '';
  filterName.value = '';
  init();
}

// Download transactions
function downloadTransactions(e) {
  e.preventDefault();

  const fileType = document.getElementById('download-type').value;
  const period = document.getElementById('download-period').value;
  const date = document.getElementById('download-date').value;

  let filteredTransactions = transactions;
  let fileName = '';

  if (period === 'day') {
    filteredTransactions = transactions.filter(t => t.date === date);
    fileName = `${date} Expenses`;
  } else if (period === 'month') {
    const [year, month] = date.split('-');
    filteredTransactions = transactions.filter(t => t.date.startsWith(`${year}-${month}`));
    const monthName = new Date(date).toLocaleString('default', { month: 'long' });
    fileName = `${monthName} ${year} Expenses`;
  } else if (period === 'year') {
    const year = date.split('-')[0];
    filteredTransactions = transactions.filter(t => t.date.startsWith(year));
    fileName = `${year} Expenses`;
  }

  if (fileType === 'pdf') {
    generatePDF(filteredTransactions, fileName);
  } else if (fileType === 'excel') {
    generateExcel(filteredTransactions, fileName);
  }

  closeDownloadModal();
}

// Generate PDF
function generatePDF(data, fileName) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(fileName, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);

  // Add table header
  let y = 30;
  doc.text("Date", 14, y);
  doc.text("Name", 50, y);
  doc.text("Category", 100, y);
  doc.text("Amount", 150, y);

  // Add table content
  data.forEach((item, i) => {
    y = y + 10;
    doc.text(item.date, 14, y);
    doc.text(item.text, 50, y);
    doc.text(item.category, 100, y);
    doc.text(item.amount.toString(), 150, y);

    // Add a new page if needed
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  // Add watermark
  doc.setTextColor(200);
  doc.setFontSize(30);
  doc.text("KRS EXPENSE Tracker", 50, 280, null, 45);

  doc.save(`${fileName}.pdf`);
}

// Generate Excel
function generateExcel(data, fileName) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// Open download modal
function openDownloadModal() {
  downloadModal.style.display = 'block';
}

// Close download modal
function closeDownloadModal() {
  downloadModal.style.display = 'none';
}

// Init app
function init() {
  list.innerHTML = '';

  transactions.forEach(addTransactionDOM);
  updateValues();
}

init();

incomeForm.addEventListener('submit', (e) => addTransaction(e, true));
expenseForm.addEventListener('submit', (e) => addTransaction(e, false));
applyFilterBtn.addEventListener('click', filterTransactions);
clearFilterBtn.addEventListener('click', clearFilters);
editForm.addEventListener('submit', updateTransaction);
cancelEditBtn.addEventListener('click', closeEditModal);

downloadBtn.addEventListener('click', openDownloadModal);
downloadForm.addEventListener('submit', downloadTransactions);
cancelDownloadBtn.addEventListener('click', closeDownloadModal);

// Close modal when clicking outside of them
window.onclick = function(event) {
  if (event.target === editModal) {
    closeEditModal();
  }
  if (event.target === downloadModal) {
    closeDownloadModal();
  }
}

