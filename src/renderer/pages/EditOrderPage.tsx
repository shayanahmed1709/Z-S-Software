import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Order } from '../../shared/types';
import { OrderForm } from '../components/OrderForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function EditOrderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const denied = user?.role === 'salesperson';

  useEffect(() => {
    if (!denied) return;
    notify('Access Denied');
    navigate('/dashboard', { replace: true });
  }, [denied, navigate, notify]);

  useEffect(() => {
    if (denied || !id) return;
    window.zs.orders
      .get(Number(id))
      .then((found) => {
        if (!found) setError('Order not found');
        setOrder(found);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to load the order'));
  }, [denied, id]);

  if (!user || denied) return null;
  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!order) return <p className="p-6 text-sm text-slate-500">Loading order…</p>;
  return <OrderForm order={order} />;
}
