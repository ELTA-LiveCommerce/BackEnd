/**
 * Jest E2E 테스트를 위한 경로 별칭 설정
 */
import { register } from 'tsconfig-paths';

// tsconfig.json에 정의된 경로 별칭을 Jest에 등록
register({
  baseUrl: './',
  paths: {
    '@/*': ['./src/*'],
    '@test/*': ['./test/*'],
  },
});
