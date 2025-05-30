import { useEffect } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { loadCaseIndex } from '../store/casesSlice';
import { Layout } from './Layout';

export function App() {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    dispatch(loadCaseIndex());
  }, [dispatch]);
  
  return <Layout />;
}