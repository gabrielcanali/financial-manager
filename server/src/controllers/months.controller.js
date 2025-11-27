import monthsService from "../services/months.service.js";

async function getMonth(req, res, next) {
  try {
    const { year, month } = req.params;
    const data = await monthsService.getMonth(year, month);

    if (!data) {
      return res.status(404).json({ error: "Mês não encontrado" });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function addEntry(req, res, next) {
  try {
    const { year, month } = req.params;
    const entry = req.body;

    // TODO: validar entry

    const updated = await monthsService.addEntry(year, month, entry);
    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

export default { getMonth, addEntry };