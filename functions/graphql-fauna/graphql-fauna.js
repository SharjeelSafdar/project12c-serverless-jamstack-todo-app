const { ApolloServer, gql } = require("apollo-server-lambda");
const faunaDB = require("faunadb");
const q = faunaDB.query;

const faunaClient = new faunaDB.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

const typeDefs = gql`
  type Todo {
    id: ID!
    content: String!
    status: Boolean!
  }
  type Query {
    todos: [Todo]!
  }
  type Mutation {
    createTodo(content: String!): Todo!
    editTodoContent(id: ID!, newContent: String!): Todo!
    toggleTodoStatus(id: ID!, newStatus: Boolean!): Todo!
    deleteTodo(id: ID!): Todo!
  }
`;

const resolvers = {
  Query: {
    todos: async (_, __, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to fetch todos.");
      }
      const res = await faunaClient.query(
        q.Paginate(q.Match(q.Index("todos_by_user"), user))
      );
      return res.data.map(([ref, content, status]) => ({
        id: ref.id,
        content,
        status,
      }));
    },
  },
  Mutation: {
    createTodo: async (_, { content }, { user }) => {
      if (!user) {
        throw new Error(`Must be authenticated to create a todo.`);
      }
      const res = await faunaClient.query(
        q.Create(q.Collection("todos"), {
          data: {
            user,
            content,
            status: false,
          },
        })
      );
      return {
        ...res.data,
        id: res.ref.id,
      };
    },
    editTodoContent: async (_, { id, newContent }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to update a todo.");
      }
      const res = await faunaClient.query(
        q.Update(q.Ref(q.Collection("todos"), id), {
          data: { content: newContent },
        })
      );
      return {
        ...res.data,
        id: res.ref.id,
      };
    },
    toggleTodoStatus: async (_, { id, newStatus }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to update a todo.");
      }
      const res = await faunaClient.query(
        q.Update(q.Ref(q.Collection("todos"), id), {
          data: { status: newStatus },
        })
      );
      return {
        ...res.data,
        id: res.ref.id,
      };
    },
    deleteTodo: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to delete a todo.");
      }
      const res = await faunaClient.query(
        q.Delete(q.Ref(q.Collection("todos"), id))
      );
      return {
        ...res.data,
        id: res.ref.id,
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // context: ({ context }) => {
  //   if (context.clientContext.user) {
  //     return { user: context.clientContext.user.sub };
  //   } else {
  //     return { user: null, context };
  //   }
  // },
  context: ({ context: theContext }) => {
    if (theContext.clientContext.user) {
      return { user: theContext.clientContext.user.sub };
    } else {
      return {};
    }
  },
  playground: true,
  introspection: true,
});

exports.handler = server.createHandler();
