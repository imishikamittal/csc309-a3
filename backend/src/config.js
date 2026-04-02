'use strict';

const config = {
  reset_cooldown: 60,
  negotiation_window: 15 * 60,
  job_start_window: 7 * 24,
  availability_timeout: 5 * 60
};

const resetRequestsByIp = new Map();

module.exports = { config, resetRequestsByIp };
