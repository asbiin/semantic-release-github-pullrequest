const verify = require('./lib/verify');
const successCall = require('./lib/success');

let verified;

async function verifyConditions(pluginConfig, context) {
  await verify(pluginConfig, context);
  verified = true;
}

async function success(pluginConfig, context) {
  if (!verified) {
    await verify(pluginConfig, context);
    verified = true;
  }

  await successCall(pluginConfig, context);
}

module.exports = {
  verifyConditions,
  success,
};
