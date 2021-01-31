import * as fse from 'fs-extra';
import { resolve } from 'path';

export function pjson(): any {
    let result = {};

    try {
        const packagePath = resolve(__dirname, '..', '..', 'package.json');
        const contents = fse.readFileSync(packagePath, { encoding: 'utf-8' });
        if (contents) {
            result = JSON.parse(contents);
        }
    }
    catch (ex) {
        // eat exception
    }

    return result;
}
