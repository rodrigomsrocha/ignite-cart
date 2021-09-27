import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const { data: stock } = await api.get(`/stock/${productId}`);

      const productExists = cart.find((product) => product.id === productId);
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (stock.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (productExists) {
        productExists.amount = amount;
      } else {
        const { data } = await api.get(`/products/${productId}`);
        updatedCart.push({ ...data, amount: 1 });
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter((product) => product.id !== productId);
      const productExists = cart.find((product) => product.id === productId);
      if (!productExists) {
        toast.error("Erro na remoção do produto");
        return;
      }
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`/stock/${productId}`);
      if (stock.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (amount < 1) return;
      const updatedCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount: amount,
          };
        }
        return product;
      });
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
