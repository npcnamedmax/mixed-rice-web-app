import { Tabs, TabsContent } from '@/components/ui/tabs';

import InferenceModule from './inference-module';
import { getMoreFoodItems } from '@/actions/foodActions';

export const dynamic = 'force-dynamic';

export default async function FoodItemsPage() {
  const { foodItems, newOffset } = await getMoreFoodItems(0, undefined, 8);

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <InferenceModule
          initialFoodItems={foodItems}
          initialOffset={newOffset}
        />
      </TabsContent>
    </Tabs>
  );
}
