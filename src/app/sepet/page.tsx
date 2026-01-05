import { Metadata } from 'next';
import SepetClient from './SepetClient';

export const metadata: Metadata = {
  title: 'Sepetim | Vadiler Çiçekçilik',
  description: 'Sepetinizdeki ürünleri görüntüleyin ve siparişinizi tamamlayın.',
};

export default function SepetPage() {
  return <SepetClient />;
}
