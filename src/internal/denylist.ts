// Real client and company names that a client-facing draft must never mention (other clients'
// information stays out of an opportunity). Internal only: registered by ./register.ts, absent
// from the demo build, and listed in scripts/check-demo-build.mjs so a leak fails that build.
export const OTHER_CLIENT_DENYLIST = ['ASSA ABLOY', 'ASSA', 'Charter Communications', 'Charter', 'Vorwerk', 'Ajman', 'AJIO', 'Jerónimo Martins', 'AstraZeneca', 'JLR', 'Jaguar Land Rover', 'Brisa', 'Vodafone', 'Mercedes-Benz']
