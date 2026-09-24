"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { checkoutAction } from "@/features/pos/actions";

interface Product {
  id: string;
  name: string;
  priceCents: number;
  stockLevel: number;
}

interface CartItem extends Product {
  quantity: number;
}

export function PosTerminal({ businessId, products }: { businessId: string; products: Product[] }) {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  const addToCart = (product: Product) => {
    if (product.stockLevel <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockLevel) {
          toast.error(`Only ${product.stockLevel} in stock`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          if (newQuantity > item.stockLevel) {
            toast.error(`Only ${item.stockLevel} in stock`);
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const totalCents = cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    
    const items = cart.map(c => ({ productId: c.id, quantity: c.quantity }));
    const result = await checkoutAction(businessId, { items });
    
    setIsCheckingOut(false);
    
    if (result.ok) {
      toast.success("Checkout successful!");
      setCart([]);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Product Grid */}
      <div className="lg:col-span-2 flex flex-col bg-slate-50/50 rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold mb-4">Products</h2>
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${product.stockLevel <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 text-center h-32 flex flex-col justify-between">
                  <div className="font-medium line-clamp-2 leading-tight">{product.name}</div>
                  <div>
                    <div className="text-primary font-bold">
                      {(product.priceCents / 100).toLocaleString(undefined, { style: "currency", currency: "NPR" })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Stock: {product.stockLevel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products found in inventory.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Shopping Cart */}
      <div className="flex flex-col bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="bg-slate-100 p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h2>
          {cart.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          )}
        </div>
        
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-12">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between font-medium">
                    <span className="truncate pr-2">{item.name}</span>
                    <span>{((item.priceCents * item.quantity) / 100).toLocaleString(undefined, { style: "currency", currency: "NPR" })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {(item.priceCents / 100).toLocaleString(undefined, { style: "currency", currency: "NPR" })} each
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-md border border-border shadow-sm p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm" onClick={() => updateQuantity(item.id, -1)}>
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3" />}
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border bg-slate-50 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary text-xl">
              {(totalCents / 100).toLocaleString(undefined, { style: "currency", currency: "NPR" })}
            </span>
          </div>
          <Button 
            className="w-full h-12 text-lg font-semibold shadow-sm" 
            disabled={cart.length === 0 || isCheckingOut}
            onClick={handleCheckout}
          >
            {isCheckingOut ? "Processing..." : "Charge Cash"}
          </Button>
        </div>
      </div>
    </div>
  );
}
