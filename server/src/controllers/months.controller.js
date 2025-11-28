import monthsService from "../services/months.service.js";
import {
  validateYearMonth,
  validateDados,
  validateCalendar,
  validateMovement,
  resolveRecurringKey,
} from "../validators/months.validator.js";

function respondValidation(res, errors) {
  if (errors.length) {
    res.status(400).json({ errors });
    return true;
  }
  return false;
}

async function getMonth(req, res, next) {
  try {
    const { year, month } = req.params;
    const errors = validateYearMonth(year, month);
    if (respondValidation(res, errors)) return;

    const data = await monthsService.getMonth(year, month);
    if (!data) {
      return res.status(404).json({ error: "Mes nao encontrado" });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function setMonthData(req, res, next) {
  try {
    const { year, month } = req.params;
    const errors = validateYearMonth(year, month);
    const validation = validateDados(req.body, { partial: false });
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await monthsService.setMonthData(
      year,
      month,
      validation.value
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function setMonthCalendar(req, res, next) {
  try {
    const { year, month } = req.params;
    const errors = validateYearMonth(year, month);
    const validation = validateCalendar(req.body, { partial: false });
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await monthsService.setMonthCalendar(
      year,
      month,
      validation.value
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function addEntry(req, res, next) {
  try {
    const { year, month } = req.params;
    const errors = validateYearMonth(year, month);
    const validation = validateMovement(req.body, { allowParcela: true });
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await monthsService.addEntry(
      year,
      month,
      validation.value
    );
    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

async function updateEntry(req, res, next) {
  try {
    const { year, month, entryId } = req.params;
    const errors = validateYearMonth(year, month);
    const validation = validateMovement(req.body, {
      allowParcela: true,
      partial: true,
    });
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await monthsService.updateEntry(
      year,
      month,
      entryId,
      validation.value
    );

    if (!updated) {
      return res.status(404).json({ error: "Lancamento nao encontrado" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteEntry(req, res, next) {
  try {
    const { year, month, entryId } = req.params;
    const errors = validateYearMonth(year, month);
    if (respondValidation(res, errors)) return;

    const updated = await monthsService.deleteEntry(year, month, entryId);
    if (!updated) {
      return res.status(404).json({ error: "Lancamento nao encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function addRecurring(req, res, next) {
  try {
    const { year, month, period } = req.params;
    const errors = validateYearMonth(year, month);
    const recurringKey = resolveRecurringKey(period);
    if (!recurringKey) {
      errors.push('period deve ser "pre" ou "pos"');
    }

    const validation = validateMovement(req.body, {
      allowParcela: false,
      allowRecorrencia: true,
      partial: false,
    });
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await monthsService.addRecurring(
      year,
      month,
      recurringKey,
      validation.value
    );
    if (!updated) {
      return res.status(404).json({ error: "Periodo invalido" });
    }

    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

async function updateRecurring(req, res, next) {
  try {
    const { year, month, period, recurringId } = req.params;
    const errors = validateYearMonth(year, month);
    const recurringKey = resolveRecurringKey(period);
    if (!recurringKey) {
      errors.push('period deve ser "pre" ou "pos"');
    }

    const validation = validateMovement(req.body, {
      allowParcela: false,
      allowRecorrencia: true,
      partial: true,
    });
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await monthsService.updateRecurring(
      year,
      month,
      recurringKey,
      recurringId,
      validation.value
    );

    if (!updated) {
      return res.status(404).json({ error: "Recorrente nao encontrado" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteRecurring(req, res, next) {
  try {
    const { year, month, period, recurringId } = req.params;
    const errors = validateYearMonth(year, month);
    const recurringKey = resolveRecurringKey(period);
    if (!recurringKey) {
      errors.push('period deve ser "pre" ou "pos"');
    }
    if (respondValidation(res, errors)) return;

    const updated = await monthsService.deleteRecurring(
      year,
      month,
      recurringKey,
      recurringId
    );

    if (!updated) {
      return res.status(404).json({ error: "Recorrente nao encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export default {
  getMonth,
  setMonthData,
  setMonthCalendar,
  addEntry,
  updateEntry,
  deleteEntry,
  addRecurring,
  updateRecurring,
  deleteRecurring,
};
