import apartmentService from "../services/apartment.service.js";
import {
  validateYearMonth,
  validateApartmentPayload,
} from "../validators/apartment.validator.js";
import { validateYear } from "../validators/months.validator.js";

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

    const data = await apartmentService.getMonth(year, month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function setMonthData(req, res, next) {
  try {
    const { year, month } = req.params;
    const errors = validateYearMonth(year, month);
    const validation = validateApartmentPayload(req.body);
    const allErrors = [...errors, ...validation.errors];
    if (respondValidation(res, allErrors)) return;

    const updated = await apartmentService.setMonthData(
      year,
      month,
      validation.value
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function getEvolution(req, res, next) {
  try {
    const { year } = req.query;
    const errors = [];
    if (year !== undefined) {
      errors.push(...validateYear(year));
    }
    if (respondValidation(res, errors)) return;

    const evolution = await apartmentService.getEvolution({ year });
    res.json(evolution);
  } catch (err) {
    next(err);
  }
}

export default { getMonth, setMonthData, getEvolution };
