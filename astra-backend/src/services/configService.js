const fs   = require('fs');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

const indentYaml = (text, spaces) =>
    text
        .trim()
        .split('\n')
        .map(line => ' '.repeat(spaces) + line)
        .join('\n');

const buildStaticHostEntry = (host) => {
    const addresses = [];
    if (host.publicIp)     addresses.push(`"${host.publicIp}:${host.port || 4242}"`);
    if (host.publicDomain) addresses.push(`"${host.publicDomain}:${host.port || 4242}"`);
    return addresses.length ? `  "${host.ip}": [${addresses.join(', ')}]\n` : '';
};

// ─── Main ────────────────────────────────────────────────────────────────────

const generateConfigYaml = (hostData, allHosts, caCert, hostCert, hostKey) => {
    const templatePath = path.join(__dirname, '../config/example.yaml');
    let config = fs.readFileSync(templatePath, 'utf-8');

    // Inject certificates
    config = config.replace('# __CA__',   `\n${indentYaml(caCert,   4)}`);
    config = config.replace('# __CERT__', `\n${indentYaml(hostCert, 4)}`);
    config = config.replace('# __KEY__',  `\n${indentYaml(hostKey,  4)}`);

    // Static host map — all hosts
    const allHostEntries = allHosts
        .filter(h => h.ip && (h.publicIp || h.publicDomain))
        .map(h => buildStaticHostEntry(h))
        .join('');

    config = config.replace(
        '# __STATIC_HOST_MAP__',
        allHostEntries ? `\n${allHostEntries}` : ''
    );

    // Lighthouse hosts list
    const lighthouseHosts = allHosts.filter(h => h.isLighthouse);
    const lighthousesList = lighthouseHosts.length
        ? lighthouseHosts.map(lh => `  - "${lh.ip}"`).join('\n')
        : '';

    config = config.replace(
        '# __LIGHTHOUSE_HOSTS__',
        lighthousesList ? `\n${lighthousesList}` : ''
    );

    // Lighthouse flag
    config = config.replace(
        /am_lighthouse:\s*(true|false)/,
        `am_lighthouse: ${hostData.isLighthouse ? 'true' : 'false'}`
    );

    return config;
};

module.exports = { generateConfigYaml };