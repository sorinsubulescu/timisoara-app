import { Redirect } from 'expo-router';
import { isTransitStandalone } from '@/constants/features';

export default function IndexRoute() {
  return <Redirect href={isTransitStandalone ? '/transit' : '/explore'} />;
}
