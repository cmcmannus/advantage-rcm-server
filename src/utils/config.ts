import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

export default function initConfig() {
    console.log(process.env.NODE_ENV);

    if (process.env.NODE_ENV === 'production') {
        console.log("Running in production mode, skipping .env file load");
        return;
    }

    console.log(`Loading environment variables from .env file for NODE_ENV=${process.env.NODE_ENV || 'dev'}`);

    // const fileUrl = import.meta.url;

    // const __dirname = path.dirname(fileURLToPath(fileUrl)).replace(/utils$/, '');

    // console.log(__dirname);

    const envFile = `.env.${process.env.NODE_ENV || 'dev'}`;
    config({ path: `./${envFile}` });
}

