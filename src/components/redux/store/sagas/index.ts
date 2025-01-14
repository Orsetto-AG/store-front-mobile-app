import { all } from 'redux-saga/effects';
import homeSagas from './homeSagas';

export default function* rootSaga() {
    yield all([...homeSagas]);
}
