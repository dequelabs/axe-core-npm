import { RawResult } from '../src/types';
import * as clone from 'clone';
import * as axe from 'axe-core';

let _dummyData: RawResult[] | axe.AxeResults;
export async function getDummyData(version = '3.1'): Promise<RawResult[]> {
  if (!_dummyData) {
    document.body.innerHTML = `
      <h1>My page </h1>
      <main>
        <p>Some page</p>
        <p><input type="text"> Failing input field</p>
      </main>
    `;
    const params: any = {
      reporter: function (raw: any, _: any, callback: Function) {
        callback(JSON.parse(JSON.stringify(raw)));
      },
      rules: [
        {
          // color contrast checking doesn't work in a jsdom environment (since it depends on canvas)
          id: 'color-contrast',
          enabled: false
        }
      ]
    };
    axe.configure(params);
    _dummyData = await axe.run();
  }
  return clone(_dummyData as RawResult[]).map((result: RawResult) => {
    result.helpUrl = result.helpUrl.replace(
      /axe\/([1-9][0-9]*\.[1-9][0-9]*)\//,
      `axe/${version}/`
    );
    return result;
  });
}
