const verify = require('./lib/verify');
const publishCall = require('./lib/publish');

let verified;

async function verifyConditions(pluginConfig, context) {
  await verify(pluginConfig, context);
  verified = true;
}

async function publish(pluginConfig, context) {
  if (!verified) {
    await verifyConditions(pluginConfig, context);
  }

  await publishCall(pluginConfig, context);
}

module.exports = {
  verifyConditions,
  publish,
};
