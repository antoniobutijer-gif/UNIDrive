'use strict';

/**
 * Omotač za async kontrolere – hvata odbijene Promise-e i prosljeđuje
 * ih Express error handleru bez potrebe za try/catch u svakoj funkciji.
 *
 * @param {Function} fn
 * @returns {import('express').RequestHandler}
 */
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
