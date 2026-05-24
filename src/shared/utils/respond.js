function ok(res, data, meta) {
  return res.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

function created(res, data) {
  return res.status(201).json({ ok: true, data });
}

function noContent(res) {
  return res.status(204).end();
}

module.exports = { ok, created, noContent };
