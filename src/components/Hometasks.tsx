import type { Hometask } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { ACTION_BUTTON, CARD, NOTIFICATION } from "styles";
import { trpc } from "utils/trpc";

const HometaskItem = ({ item }: { item: Hometask & any }) => {
  const [isFinished, setIsFinished] = useState(item.finished);
  const finishHometask = trpc.useQuery(["hometask.finish", { id: item.id }]);

  return (
    <>
      <div className="w-full">
        <Link href={`/workspace/hometasks/${item.id}`}>
          <a className="text-xl">{item.title}</a>
        </Link>
        <p className="text-gray-400">{item.content?.slice(0, 50)}</p>
      </div>
      <div className="w-full flex items-center justify-between">
        <p className="font-semibold">{item.topic.name}</p>
        <p>{item.due?.toLocaleDateString()}</p>
      </div>
    </>
  );
};

export const HometaskSection = () => {
  const { data: session } = useSession();
  const hometasksQuery = trpc.useInfiniteQuery(
    ["hometask.infinite", { limit: 5, userId: session?.user?.id || "" }],
    {
      getPreviousPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <div className="lg:mx-4">
      <h1 className={`${NOTIFICATION} text-center`}>
        Hometasks page. Here are your most recent things to do.
      </h1>
      <Link href="/new/hometask">
        <button className={`${ACTION_BUTTON} w-full`}>Add Hometask</button>
      </Link>
      {hometasksQuery.data?.pages.map((page, index) => (
        <>
          {page.items.length > 0 ? (
            <div key={page.items[0].id || index} className={`${CARD} my-4`}>
              {page.items.map((item) => (
                <HometaskItem item={item} />
              ))}
            </div>
          ) : (
            <p className="my-4">No hometasks yet.</p>
          )}
        </>
      ))}
      {/* Pagination */}
      <button
        className={ACTION_BUTTON}
        onClick={() => hometasksQuery.fetchPreviousPage()}
        disabled={
          !hometasksQuery.hasPreviousPage ||
          hometasksQuery.isFetchingPreviousPage
        }
      >
        {hometasksQuery.isFetchingPreviousPage
          ? "Loading more..."
          : hometasksQuery.hasPreviousPage
          ? "Load More"
          : "Nothing more to load"}
      </button>
    </div>
  );
};
