const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createApp } = require('../src/app');

let server;
let baseUrl;
let dataSnapshot;

async function startServer() {
  const app = createApp();
  return new Promise((resolve) => {
    const instance = app.listen(0, () => {
      const { port } = instance.address();
      resolve({
        server: instance,
        baseUrl: `http://127.0.0.1:${port}`,
      });
    });
  });
}

async function stopServer(instance) {
  if (!instance) {
    return;
  }
  await new Promise((resolve, reject) => {
    instance.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function request(base, { method, path: requestPath, body }) {
  const url = new URL(requestPath, base);
  const payload = body ? JSON.stringify(body) : null;

  const options = {
    method,
    hostname: url.hostname,
    port: url.port,
    path: `${url.pathname}${url.search}`,
    headers: {
      'content-type': 'application/json',
    },
  };

  if (payload) {
    options.headers['content-length'] = Buffer.byteLength(payload);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        let json = null;
        if (raw.length > 0) {
          try {
            json = JSON.parse(raw);
          } catch (error) {
            reject(error);
            return;
          }
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assertSuccess(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.body?.success, true);
  assert.ok('data' in response.body);
  assert.ok('meta' in response.body);
}

function assertError(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.body?.success, false);
  assert.equal(response.body?.error?.code, code);
  assert.ok('message' in response.body.error);
}

async function listDataFiles(rootDir) {
  const files = [];
  let entries = [];

  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return files;
    }
    throw error;
  }

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
    if (entry.isDirectory() && entry.name === 'transactions') {
      const txEntries = await fs.readdir(fullPath, { withFileTypes: true });
      txEntries.forEach((txEntry) => {
        if (txEntry.isFile() && txEntry.name.endsWith('.json')) {
          files.push(path.join(fullPath, txEntry.name));
        }
      });
    }
  }

  return files;
}

async function snapshotDataFiles() {
  const dataRoot = path.resolve(__dirname, '..', '..', 'data');
  const files = await listDataFiles(dataRoot);
  const snapshot = new Map();

  await Promise.all(
    files.map(async (filePath) => {
      const content = await fs.readFile(filePath, 'utf8');
      snapshot.set(filePath, content);
    })
  );

  return { dataRoot, snapshot };
}

async function restoreDataFiles(snapshotInfo) {
  if (!snapshotInfo) {
    return;
  }
  const { dataRoot, snapshot } = snapshotInfo;
  const currentFiles = await listDataFiles(dataRoot);
  const currentSet = new Set(currentFiles);

  for (const currentFile of currentFiles) {
    if (!snapshot.has(currentFile)) {
      await fs.unlink(currentFile);
    }
  }

  for (const [filePath, content] of snapshot.entries()) {
    if (!currentSet.has(filePath)) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    }
    await fs.writeFile(filePath, content, 'utf8');
  }
}

before(async () => {
  dataSnapshot = await snapshotDataFiles();
  const started = await startServer();
  server = started.server;
  baseUrl = started.baseUrl;
});

after(async () => {
  await restoreDataFiles(dataSnapshot);
  await stopServer(server);
});

test('health contract', async () => {
  const response = await request(baseUrl, { method: 'GET', path: '/health' });
  assertSuccess(response, 200);
  assert.equal(response.body.data.status, 'ok');
});

test('categories contract', async () => {
  const listResponse = await request(baseUrl, { method: 'GET', path: '/categories' });
  assertSuccess(listResponse, 200);
  assert.ok(Array.isArray(listResponse.body.data.items));

  const invalidCreate = await request(baseUrl, {
    method: 'POST',
    path: '/categories',
    body: { name: 'Categoria Teste' },
  });
  assertError(invalidCreate, 400, 'VALIDATION_ERROR');

  const createPayload = { id: 'cat_test_api_024', name: 'Categoria Teste' };
  const createResponse = await request(baseUrl, {
    method: 'POST',
    path: '/categories',
    body: createPayload,
  });
  assertSuccess(createResponse, 201);
  assert.equal(createResponse.body.data.id, createPayload.id);

  const invalidUpdate = await request(baseUrl, {
    method: 'PUT',
    path: `/categories/${createPayload.id}`,
    body: { id: 'other', name: 'Categoria Atualizada' },
  });
  assertError(invalidUpdate, 400, 'VALIDATION_ERROR');

  const updateResponse = await request(baseUrl, {
    method: 'PUT',
    path: `/categories/${createPayload.id}`,
    body: { name: 'Categoria Atualizada' },
  });
  assertSuccess(updateResponse, 200);
  assert.equal(updateResponse.body.data.name, 'Categoria Atualizada');

  const deleteResponse = await request(baseUrl, {
    method: 'DELETE',
    path: `/categories/${createPayload.id}`,
  });
  assertSuccess(deleteResponse, 200);
});

test('credit card contract', async () => {
  const getResponse = await request(baseUrl, {
    method: 'GET',
    path: '/credit-cards',
  });
  assertSuccess(getResponse, 200);
  assert.equal(typeof getResponse.body.data.closingDay, 'number');

  const invalidUpdate = await request(baseUrl, {
    method: 'PUT',
    path: '/credit-cards',
    body: { closingDay: 0 },
  });
  assertError(invalidUpdate, 400, 'VALIDATION_ERROR');

  const updateResponse = await request(baseUrl, {
    method: 'PUT',
    path: '/credit-cards',
    body: { closingDay: 15 },
  });
  assertSuccess(updateResponse, 200);
  assert.equal(updateResponse.body.data.closingDay, 15);
});

test('transactions contract', async () => {
  const invalidMonth = await request(baseUrl, {
    method: 'GET',
    path: '/transactions/2030-13',
  });
  assertError(invalidMonth, 400, 'VALIDATION_ERROR');

  const month = '2030-01';
  const transactionId = 'tx_test_api_024';
  const payload = {
    id: transactionId,
    date: '2030-01-10',
    amount: 120,
    direction: 'expense',
    categoryId: 'cat_saved',
    description: 'Compra Teste',
    status: 'confirmed',
    source: { type: 'manual' },
  };

  const createResponse = await request(baseUrl, {
    method: 'POST',
    path: `/transactions/${month}`,
    body: payload,
  });
  assertSuccess(createResponse, 201);

  const listResponse = await request(baseUrl, {
    method: 'GET',
    path: `/transactions/${month}`,
  });
  assertSuccess(listResponse, 200);
  assert.ok(listResponse.body.data.items.some((item) => item.id === transactionId));

  const invalidUpdate = await request(baseUrl, {
    method: 'PUT',
    path: `/transactions/${month}/${transactionId}`,
    body: { ...payload, id: 'other' },
  });
  assertError(invalidUpdate, 400, 'VALIDATION_ERROR');

  const updateResponse = await request(baseUrl, {
    method: 'PUT',
    path: `/transactions/${month}/${transactionId}`,
    body: { ...payload, amount: 150, description: 'Compra Atualizada' },
  });
  assertSuccess(updateResponse, 200);
  assert.equal(updateResponse.body.data.amount, 150);

  const deleteResponse = await request(baseUrl, {
    method: 'DELETE',
    path: `/transactions/${month}/${transactionId}`,
  });
  assertSuccess(deleteResponse, 200);
});

test('recurring contract and integration', async () => {
  const invalidCreate = await request(baseUrl, {
    method: 'POST',
    path: '/recurrences',
    body: { id: 'rec_invalid' },
  });
  assertError(invalidCreate, 400, 'VALIDATION_ERROR');

  const recurringId = 'rec_test_api_024';
  const payload = {
    id: recurringId,
    name: 'Recorrencia Teste',
    direction: 'expense',
    amount: 75,
    categoryId: 'cat_saved',
    schedule: { frequency: 'monthly', dayOfMonth: 5 },
    payment: { mode: 'direct' },
    isActive: true,
  };

  const createResponse = await request(baseUrl, {
    method: 'POST',
    path: '/recurrences',
    body: payload,
  });
  assertSuccess(createResponse, 201);

  const listResponse = await request(baseUrl, {
    method: 'GET',
    path: '/recurrences',
  });
  assertSuccess(listResponse, 200);
  assert.ok(listResponse.body.data.items.some((item) => item.id === recurringId));

  const updateResponse = await request(baseUrl, {
    method: 'PUT',
    path: `/recurrences/${recurringId}`,
    body: { ...payload, name: 'Recorrencia Atualizada' },
  });
  assertSuccess(updateResponse, 200);
  assert.equal(updateResponse.body.data.name, 'Recorrencia Atualizada');

  const month = '2030-04';
  const generateResponse = await request(baseUrl, {
    method: 'POST',
    path: `/recurrences/${month}/generate`,
  });
  assertSuccess(generateResponse, 201);
  assert.ok(generateResponse.body.data.items.length > 0);

  const transactionsResponse = await request(baseUrl, {
    method: 'GET',
    path: `/transactions/${month}`,
  });
  assertSuccess(transactionsResponse, 200);
  assert.ok(
    transactionsResponse.body.data.items.some(
      (item) => item.source?.type === 'recurring' && item.status === 'confirmed'
    )
  );

  const deleteResponse = await request(baseUrl, {
    method: 'DELETE',
    path: `/recurrences/${recurringId}`,
  });
  assertSuccess(deleteResponse, 200);
});

test('salary contract and integration', async () => {
  const invalidUpdate = await request(baseUrl, {
    method: 'PUT',
    path: '/salaries',
    body: {
      baseSalary: 2000,
      direction: 'expense',
      paymentDay: 25,
      categoryId: 'cat_saved',
      description: 'Salario Teste',
      advance: { enabled: true, day: 10, type: 'percent', value: 40 },
    },
  });
  assertError(invalidUpdate, 400, 'VALIDATION_ERROR');

  const validUpdate = await request(baseUrl, {
    method: 'PUT',
    path: '/salaries',
    body: {
      baseSalary: 2000,
      direction: 'income',
      paymentDay: 25,
      categoryId: 'cat_saved',
      description: 'Salario Teste',
      advance: { enabled: true, day: 10, type: 'percent', value: 40 },
    },
  });
  assertSuccess(validUpdate, 200);

  const month = '2030-03';
  const generateResponse = await request(baseUrl, {
    method: 'POST',
    path: `/salaries/${month}/generate`,
  });
  assertSuccess(generateResponse, 201);
  assert.equal(generateResponse.body.data.items.length, 2);

  const confirmResponse = await request(baseUrl, {
    method: 'POST',
    path: `/salaries/${month}/confirm`,
    body: { currentDate: '2030-03-30' },
  });
  assertSuccess(confirmResponse, 200);
  assert.equal(confirmResponse.body.data.updated, 2);

  const transactionsResponse = await request(baseUrl, {
    method: 'GET',
    path: `/transactions/${month}`,
  });
  assertSuccess(transactionsResponse, 200);
  const salaryItems = transactionsResponse.body.data.items.filter(
    (item) => item.source?.type === 'salary'
  );
  assert.equal(salaryItems.length, 2);
  salaryItems.forEach((item) => {
    assert.equal(item.status, 'confirmed');
  });
});

test('installments contract and integration', async () => {
  const invalidCreate = await request(baseUrl, {
    method: 'POST',
    path: '/installments',
    body: { groupId: 'inst_invalid' },
  });
  assertError(invalidCreate, 400, 'VALIDATION_ERROR');

  const payload = {
    parentId: 'inst_parent_api_024',
    groupId: 'inst_group_api_024',
    total: 2,
    mode: 'direct',
    firstDate: '2030-01-15',
    amount: 300,
    direction: 'expense',
    categoryId: 'cat_saved',
    description: 'Parcelamento Teste',
    ids: ['inst_tx_api_024_1', 'inst_tx_api_024_2'],
  };

  const createResponse = await request(baseUrl, {
    method: 'POST',
    path: '/installments',
    body: payload,
  });
  assertSuccess(createResponse, 201);
  assert.equal(createResponse.body.data.items.length, 2);

  const parentUpdate = await request(baseUrl, {
    method: 'PUT',
    path: `/installments/parents/${payload.groupId}`,
    body: {
      id: payload.parentId,
      date: payload.firstDate,
      amount: 350,
      direction: payload.direction,
      categoryId: payload.categoryId,
      description: 'Parcelamento Atualizado',
      source: { type: 'installment' },
      installment: {
        groupId: payload.groupId,
        mode: payload.mode,
        total: payload.total,
        index: null,
      },
    },
  });
  assertSuccess(parentUpdate, 200);
  assert.equal(parentUpdate.body.data.updatedParcels, 1);

  const parcelUpdate = await request(baseUrl, {
    method: 'PUT',
    path: '/installments/parcels/2030-02/inst_tx_api_024_2',
    body: {
      id: 'inst_tx_api_024_2',
      date: '2030-02-15',
      amount: 360,
      direction: payload.direction,
      categoryId: payload.categoryId,
      description: 'Parcela Ajustada',
      status: 'projected',
      source: { type: 'installment' },
      installment: {
        groupId: payload.groupId,
        mode: payload.mode,
        total: payload.total,
        index: 2,
      },
    },
  });
  assertSuccess(parcelUpdate, 200);
  assert.equal(parcelUpdate.body.data.editedManually, true);

  const deleteResponse = await request(baseUrl, {
    method: 'DELETE',
    path: `/installments/parents/${payload.groupId}?deleteParcels=true`,
  });
  assertSuccess(deleteResponse, 200);
});

test('dashboard contract', async () => {
  const invalidMonthly = await request(baseUrl, {
    method: 'GET',
    path: '/dashboard/monthly/2030-13',
  });
  assertError(invalidMonthly, 400, 'VALIDATION_ERROR');

  const invalidAnnual = await request(baseUrl, {
    method: 'GET',
    path: '/dashboard/annual/203',
  });
  assertError(invalidAnnual, 400, 'VALIDATION_ERROR');

  const monthlyResponse = await request(baseUrl, {
    method: 'GET',
    path: '/dashboard/monthly/2030-04',
  });
  assertSuccess(monthlyResponse, 200);
  assert.equal(monthlyResponse.body.data.month, '2030-04');

  const annualResponse = await request(baseUrl, {
    method: 'GET',
    path: '/dashboard/annual/2030',
  });
  assertSuccess(annualResponse, 200);
  assert.equal(annualResponse.body.data.year, '2030');
});

test('meta contract', async () => {
  const getResponse = await request(baseUrl, {
    method: 'GET',
    path: '/meta',
  });
  assertSuccess(getResponse, 200);

  const invalidUpdate = await request(baseUrl, {
    method: 'PUT',
    path: '/meta',
    body: { lastOpenedMonth: '2030-13' },
  });
  assertError(invalidUpdate, 400, 'VALIDATION_ERROR');

  const updateResponse = await request(baseUrl, {
    method: 'PUT',
    path: '/meta',
    body: { lastOpenedMonth: '2030-01' },
  });
  assertSuccess(updateResponse, 200);
  assert.equal(updateResponse.body.data.lastOpenedMonth, '2030-01');
});
