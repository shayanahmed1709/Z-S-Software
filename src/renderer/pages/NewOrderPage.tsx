import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderForm } from '../components/OrderForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function NewOrderPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const denied = user?.role === 'salesperson';

  useEffect(() => {
    if (!denied) return;
    notify('Access Denied');
    navigate('/dashboard', { replace: true });
  }, [denied, navigate, notify]);

  if (!user || denied) return null;
  return <OrderForm />;
}
