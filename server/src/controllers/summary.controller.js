import summaryService from "../services/summary.service.js";
import { validateYearMonth, validateYear } from "../validators/months.validator.js";

function respondValidation(res, errors) {
  if (errors.length) {
    res.status(400).json({ errors });
    return true;
  }
  return false;
}

async function getMonthSummary(req, res, next) {
  try {
    const { year, month } = req.params;
    const errors = validateYearMonth(year, month);
    if (respondValidation(res, errors)) return;

    const summary = await summaryService.getMonthSummary(year, month);
    if (!summary) {
      return res.status(404).json({ error: "Mes nao encontrado" });
    }

    res.json(summary);
  } catch (err) {
    next(err);
  }
}

async function getYearSummary(req, res, next) {
  try {
    const { year } = req.params;
    const errors = validateYear(year);
    if (respondValidation(res, errors)) return;

    const summary = await summaryService.getYearSummary(year);
    if (!summary) {
      return res.status(404).json({ error: "Ano nao encontrado" });
    }

    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export default { getMonthSummary, getYearSummary };
