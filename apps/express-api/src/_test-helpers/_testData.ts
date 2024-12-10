import { TestDataService } from './testDataService';

async function main() {
  await TestDataService.Instance.generateStaticTestData();
  console.log('----- #### -----  Test Data Completed ----- #### -----');
}

main();
