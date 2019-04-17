const graphql = require('graphql');
const axios = require('axios');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

// example queries:
// {
//   user(id: "40") {
//     id,
//     firstName,
//     age,
//     company {
//      id,
//      description
//     }
//   }
// }
//
//{
//   company(id: "1") {
//     id,
//       name
//   }
// }
//
// company(id: "1") {
//   id,
//   users {
//     id,
//     name
//   }
//}
// named queries:
// query findCompany {
//   company(id: "1") {
//      ...
//   }
//}
// naming response:
// {
//   apple: company(id: "1") {
//     id,
//     name
//   }
//   google: company(id: "2") {
//     id,
//     name,
//     users
//   }
// }

// you can also use query fragments to reduce duplication, i.e.:
// fragment companyDetails on Company {
//   id,
//   name,
//   description
// }
// then you can use it in your query with  ...companyDetails


const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${parentValue.company_id}/users`)
          .then(res => res.data);
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLString },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        // parentValue refers to the 'user' object here
        console.log(parentValue, args);
        return axios.get(`http://localhost:3000/companies/${parentValue.company_id}`)
          .then(res => res.data);
      }
    }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        // resolve is used to return the actual data from whatever datastore we are using
        // hardcoded synchronous example: return _.find(users, { id: args.id });
        // if we return a promise, graphql automatically detects this, waits for it to resolve
        //   and then grabs the data and returns it to the user
        return axios.get(`http://localhost:3000/users/${args.id}`)
          .then(resp => resp.data);
      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        // we can look for a user as the root type, or a company
        return axios.get(`http://localhost:3000/companies/${args.id}`)
          .then(resp => resp.data);
      }
    }
  }
});

// type is the type of data we are returning
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        company_id: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
        return axios.post('http://localhost:3000/users', { firstName, age })
          .then(resp => resp.data);
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, { id }) {
        return axios.delete(`http://localhost:3000/users/${id}`)
          .then(resp => resp.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company_id: { type: GraphQLString }
      },
      resolve(parentValue, { id, firstName, age, company_id }) {
        return axios.patch(`http://localhost:3000/users/${id}`, { firstName, age, company_id })
          .then(resp => resp.data);
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: mutation
});