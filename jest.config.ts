import { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    transform: {
        '^.+\\.(ts)?$': [
            'ts-jest', {}
        ]
    }
}

export default jestConfig
