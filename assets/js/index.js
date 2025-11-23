function floatToMoney(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function moneyToFloat (value) {
  return parseFloat(
    value.replace('R$', '').replace(/\./g, '').replace(',', '.')
  ) || 0;
}

function parseMoney (value) {
    let v = value.replace(/\D/g, '');
    v = (v / 100).toFixed(2).replace('.', ',');
    v = v.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return 'R$ ' + v
}

const valueInput = $('#valueInput')
const valueType = $('#valueType')
const valueSubmit = $('#valueSubmit')
const listPlusHtml = $('#listPlus')
const listMinusHtml = $('#listMinus')
const valueTotalHtml = $('#valueTotal')

let plusValueList = []
let minusValueList = []

function clearInputs () {
    valueInput.val(null)
    valueType.val("plus")
}

function getPlusTotal () {
    return plusValueList.reduce((total, value) => total + value, 0);
}

function getMinusTotal () {
    return minusValueList.reduce((total, value) => total + value, 0);
}

function getTotal () {
    return getPlusTotal() - getMinusTotal();
}

function addPlusValue (value) {
    return plusValueList.push(value)
}

function addMinusValue (value) {
    return minusValueList.push(value)
}

function updateTotalValueHtml () {
    const totalValue = getTotal()
    valueTotalHtml.html(floatToMoney(totalValue))
    valueTotalHtml.removeClass("text-success text-danger text-black")
    
    const textColor = totalValue == 0 ? "text-black"
        : totalValue > 0 ? "text-success" : "text-danger" 

    valueTotalHtml.addClass(textColor)
}

function addValueToList () {
  const rawVal = valueInput.val();

  if (!rawVal) {
    return;
  }

  const floatVal = moneyToFloat(rawVal);
  if (!floatVal) {
    return;
  }

  if (valueType.val() === 'minus') {
    addMinusValue(floatVal);

    listMinusHtml.append(
      `<div class="py-2 fs-5 text-start">${floatToMoney(floatVal)}</div>`
    );
  } else {
    addPlusValue(floatVal);

    listPlusHtml.append(
      `<div class="py-2 fs-5 text-start">${floatToMoney(floatVal)}</div>`
    );
  }
}

valueInput.on('input', function () {
    this.value = parseMoney(this.value);
});

valueSubmit.on('click', function () {
    addValueToList()
    clearInputs()
    updateTotalValueHtml()
});

$(function() {
    updateTotalValueHtml()
});