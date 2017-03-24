const jetpack = require('fs-jetpack');

module.exports = (extractPath, electronVersion, platform, arch, done) => {
    jetpack.copy('./config_files', `${extractPath}/config_files`);

    const packageArch = arch === 'ia32' ? 'x32' : arch;
    jetpack.copy('./bundled', `${extractPath}/bundled`, {
        matching: [`*-${platform}`, `*-${platform}-${packageArch}`],
    });

    done();
};
