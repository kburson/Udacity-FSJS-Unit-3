import exec from 'shelljs.exec';
import fs from 'node:fs';
import path from 'node:path';

function appendLog(message: string) {
  const logDate = new Date();
  const filePath = path.join(__dirname, 'globalSetup.log');
  fs.appendFile(
    filePath,
    `${logDate.toLocaleString()} - ${message}\n`,
    (err) => {
      if (err) console.error('failed to append log file', err);
    }
  );
}
async function setup(): Promise<void> {
  // add to a log file.

  appendLog('start');

  console.log('\n\n############ Reset Test Database ##############\n');
  exec('db-migrate reset -e test', { stdio: 'inherit' });
  console.log('\n\n############ Refresh Test Database ############\n');
  exec('db-migrate up -e test', { stdio: 'inherit' });
  console.log('\n\n########## Test Data Setup Complete ###########\n\n');

  appendLog('finish');
}

export default setup;
