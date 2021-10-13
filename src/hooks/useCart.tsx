import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExist = cart.find(({ id }) => id === productId)

      if (productExist) {
        const { data } = await api.get<Stock>(`stock/${productId}`)

        const total = productExist.amount + 1

        if (total > data.amount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        const newCart = cart.map((product) => product.id === productId ? ({
          ...product,
          amount: total
        }) : product)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

        setCart(newCart)

        return
      }

      const { data } = await api.get<Product>(`products/${productId}`)

      setCart(oldCart => {

        const newCart = [...oldCart, {...data, amount: 1}]
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        return newCart

      })

    } catch {
      toast.error('Erro na adição do produto')
    }


  };

  const removeProduct = (productId: number) => {
    try {
      const existProduct = cart.some(product => product.id === productId)

      if (existProduct) {
        const newCart = cart.filter(({ id }) => id !== productId)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)

        return
      }

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Erro na alteração de quantidade do produto')

        return
      }

      const { data } = await api.get<Stock>(`stock/${productId}`)

      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque')

        return
      }

      const newCart = cart.map((product) => product.id === productId ? ({
        ...product,
        amount
      }) : product )

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)

    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
