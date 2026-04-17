'use server';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { FoodItemEditModule } from './edit-food-module';
import { getMoreFoodItems } from '@/actions/foodActions';

//export const dynamic = 'force-dynamic';

export default async function FoodItemsPage(props: {
  searchParams: Promise<{ q: string; offset: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.q ?? null;
  const offset = searchParams.offset ?? 0;
  const { foodItems, newOffset } = await getMoreFoodItems(
    Number(offset),
    search,
    8
  );

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <FoodItemEditModule
          initFoodItems={foodItems}
          initNewOffset={newOffset}
          initSearch={search}
        />
      </TabsContent>
    </Tabs>
  );
}
