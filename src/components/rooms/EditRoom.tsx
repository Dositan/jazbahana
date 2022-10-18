import type { Room, Topic } from "@prisma/client";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IoClose } from "react-icons/io5";
import {
  ACTION_BUTTON,
  CARD,
  DELETE_BUTTON,
  INPUT_SELECT,
  INPUT_TEXT,
} from "styles";
import { trpc } from "utils/trpc";

type EditRoomProps = {
  data?: Room | null;
  topics?: Topic[] | null;
  session?: Session | null;
  router: any;
};

type FormData = {
  id: string;
  title: string;
  description: string;
  topicId: string;
};

export default function EditRoom({
  data,
  topics,
  session,
  router,
}: EditRoomProps) {
  const id = router.query.id as string;
  const userId = session?.user?.id as string;
  const topic = topics?.find((t: Topic) => t.id === data?.topicId);
  const [editing, setEditing] = useState(false);
  // Form
  const { register, handleSubmit } = useForm<FormData>();
  // tRPC
  const utils = trpc.useContext();
  const editRoom = trpc.useMutation("room.edit", {
    async onSuccess() {
      await utils.invalidateQueries(["room.byId", { id }]);
      setEditing(false);
    },
  });
  const deleteRoom = trpc.useMutation("room.delete", {
    async onSuccess() {
      router.push("/feed");
    },
  });
  const joinRoom = trpc.useMutation("participant.join", {
    async onSuccess() {
      await utils.invalidateQueries([
        "participant.hasJoined",
        { roomId: id, userId },
      ]);
      await utils.invalidateQueries("participant.all");
    },
  });
  // States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");

  const onSubmit = handleSubmit(async () => {
    try {
      await editRoom.mutateAsync({
        id,
        data: { title, description, topicId },
      });
    } catch {}
  });

  useEffect(() => {
    setTitle(data?.title || "");
    setDescription(data?.description || "");
    setTopicId(data?.topicId || "");
  }, []);

  return (
    <>
      <div className="flex gap-2 my-2">
        {session && (
          <button
            className={ACTION_BUTTON}
            onClick={() => joinRoom.mutate({ userId, roomId: id })}
          >
            Join
          </button>
        )}
        {userId === data?.authorId && (
          <>
            <button
              className={ACTION_BUTTON}
              onClick={() => setEditing(!editing)}
            >
              Edit
            </button>
            <button
              className={DELETE_BUTTON}
              onClick={() => deleteRoom.mutate({ id })}
            >
              Delete
            </button>
          </>
        )}
      </div>
      <div className={`my-4 flex items-center justify-center ${CARD}`}>
        <form hidden={!editing} className="w-[90%]" onSubmit={onSubmit}>
          <button
            onClick={() => setEditing(false)}
            className="absolute w-max p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 hover:duration-500"
          >
            <IoClose size={24} />
          </button>
          <h2 className="text-center text-2xl leading-normal">Edit Room</h2>
          <div className="my-4">
            <label className="text-xl" htmlFor="title">
              Title:
            </label>
            <input
              id="title"
              {...register("title")}
              className={INPUT_TEXT}
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              disabled={editRoom.isLoading}
            />
          </div>
          {/* Description */}
          <div className="my-4">
            <label className="text-xl" htmlFor="description">
              Description:
            </label>
            <input
              id="description"
              {...register("description")}
              className={INPUT_TEXT}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              disabled={editRoom.isLoading}
            />
          </div>
          {/* Topic */}
          <div className="my-4">
            <label className="text-xl" htmlFor="topicId">
              Topic:
            </label>
            <select
              {...register("topicId")}
              id="topicId"
              className={INPUT_SELECT}
              onChange={(e) => setTopicId(e.currentTarget.value)}
            >
              {topic ? (
                <option value={topic.id}>{topic.name}</option>
              ) : (
                <option selected>Choose a topic</option>
              )}
              {topics &&
                topics.map((t: Topic) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
          {/* Save */}
          <button
            className="py-2 px-4 rounded-md text-white bg-blue-500 hover:bg-blue-600 hover:duration-500"
            onClick={() => console.log(topic)}
            disabled={editRoom.isLoading}
          >
            Save
          </button>
          {/* Error occurred */}
          {editRoom.error && (
            <p className="text-red-500">{editRoom.error.message}</p>
          )}
        </form>
      </div>
    </>
  );
}