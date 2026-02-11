import type {
  Content,
  Tag,
  Collection,
  CollectionItem,
  ContentRelation,
  ContentImage,
} from '@prisma/client'

export type ContentWithRelations = Content & {
  tags: { tag: Tag }[]
  collectionItems: (CollectionItem & { collection: Collection })[]
  images: ContentImage[]
  relationsFrom: (ContentRelation & {
    toContent: Pick<Content, 'id' | 'title' | 'contentType' | 'slug'>
  })[]
  primaryCollection: Collection | null
}
